from docx2python import docx2python
from pymongo import MongoClient
import gridfs
from bs4 import BeautifulSoup
import re
import pymupdf
import xml.etree.ElementTree as ET
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash
from dotenv import dotenv_values
from bson import ObjectId
from datetime import datetime, timezone # changed this from *import datetime*
import requests

def connect_db():
    config = dotenv_values(".env")
    # print("database config")
    # print(config)
    client = MongoClient(config['DB_URL'])
    return client['demo']

def whoami(userId):
    db = connect_db()
    # ObjectId(userId)
    currUser = db['users'].find_one({"_id": ObjectId(userId)})
    print(userId)
    print(currUser)
    return currUser["username"],currUser["role"]

def register_user(username, email, password):
    db = connect_db()
    users = db['users']
    if users.find_one({"email": email}) and users.find_one({"username": username}):
        return True, 'Email and Username already exists'
    if users.find_one({"email": email}):
        return True, 'Email already exists'
    if users.find_one({"username": username}):
        return True, 'UserName already exists'
    hashed_password = generate_password_hash(password)
    user_id = users.insert_one({
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": "user",
        "status": True,
        "notes": [],
        "library": []
    }).inserted_id
    return False, user_id

def login_user(email, password):
    db = connect_db()
    users = db['users']
    user = users.find_one({"email": email})
    if user:
        if check_password_hash(user['password'], password):
            if not user['status']:
                return "Blocked Account", None
            return str(user['_id']), user["role"]
        else:
            return "Wrong Password", None
    else:
        return None

def load_regions_from_docx(file_path, reference_map=None):
    doc_content = docx2python(file_path)
    endnotes = parse_endnotes(doc_content.endnotes)
    flat_text_list = flatten_document(doc_content.body)

    regions = []
    start_processing = False
    last_endnote = None

    for text in flat_text_list:
        if 'central nervous system [rat]' in text.lower():
            start_processing = True
        elif start_processing and text:
            region_info, last_endnote = parse_region(text, endnotes, last_endnote)

            if region_info.get('names'):
                if reference_map and 'endnote_nums' in region_info:
                    refs = set()
                    for num in region_info['endnote_nums']:
                        if num != '1' and num in reference_map:
                            refs.update(reference_map[num])
                    region_info['references'] = list(refs)

                # Remove helper field before saving
                region_info.pop('endnote_nums', None)

                regions.append(region_info)

    if regions:
        db = connect_db()
        collection = db['regions']
        collection.insert_many(regions)
        return f"{len(regions)} regions loaded into MongoDB"
    else:
        return "No regions were found in the document."


def flatten_document(nested_list):
    flat_list = []
    for item in nested_list:
        if isinstance(item, list):
            flat_list.extend(flatten_document(item))
        elif isinstance(item, str) and item.strip():
            flat_list.append(item.strip())
    return flat_list

def parse_region(text, endnotes, last_endnote):
    parts = text.split(' or ')
    names = []
    abbreviations = []
    endnote_texts = []
    endnote_refs = []

    for part in parts:
        # Extract name (before first parenthesis)
        name_match = re.match(r"([^(]+)", part)
        if name_match:
            names.append(name_match.group(1).strip())

        # Extract all abbreviations inside parentheses
        abbr_match = re.findall(r'\(([^)]+)\)', part)
        if abbr_match:
            abbreviations.append(abbr_match[-1])

    found_refs = re.findall(r'endnote(\d+)', text)
    
    if found_refs:
        endnote_refs = found_refs
        endnote_texts = [endnotes.get(ref, f"MISSING ENDNOTE {ref}") for ref in found_refs]
        last_endnote = found_refs[-1]
    elif last_endnote:
        endnote_refs = [last_endnote]
        endnote_texts = [endnotes.get(last_endnote, f"MISSING ENDNOTE {last_endnote}")]

    return {
        'names': names,
        'abbreviations': abbreviations,
        'endnotes': endnote_texts,
        'endnote_nums': endnote_refs
    }, last_endnote


def parse_endnotes(endnotes):
    note_dict = {}

    if not endnotes or not isinstance(endnotes, list):
        return note_dict 

    flattened_endnotes = flatten_document(endnotes)  

    for line in flattened_endnotes:
        match = re.match(r"endnote(\d+)\)\t(.+)", line)
        if match:
            endnote_number = match.group(1)  
            note_text = match.group(2).strip() 
            note_dict[endnote_number] = note_text 

    return note_dict  

def load_reference_mappings(txt_path):
    reference_map = {}
    with open(txt_path, 'r') as file:
        for line in file:
            match = re.match(r'^(\d+)\.\s+(.*)', line.strip())
            if match:
                num = str(int(match.group(1)))  # Shift by +1
                refs = [r.strip() for r in match.group(2).split(',')]
                reference_map[num] = refs
    return reference_map

def get_references_by_region_id(region_id):
    from bson import ObjectId
    db = connect_db()
    collection = db['regions']
    region = collection.find_one({"_id": ObjectId(region_id)})
    if region:
        return region.get("references", [])
    return []

def get_all_regions():
    db = connect_db()
    collection = db['regions']
    return list(collection.find({}, {'_id': 0}))

################################################## NOTES START
# Create a new note
def create_note(title, content, username, region):
    db = connect_db()
    users_collection = db['users']

    user = users_collection.find_one({"username": username})

    if not user:
        raise ValueError("User not found")

    note = {
        "_id": ObjectId(),
        "title": title,
        "content": content,
        "region": region,
        "public": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    result = users_collection.update_one(
        {"_id": user["_id"]}, 
        {"$push": {"notes": note}}
    )

    return str(note["_id"]) if result.modified_count > 0 else None

# Get all active notes for a user
def get_notes(user_id):
    db = connect_db()
    users_collection = db['users']

    user = users_collection.find_one({"username": user_id}, {"notes": 1})

    if user and 'notes' in user:
        notes = user['notes']
        for note in notes:
            note['_id'] = str(note['_id']) 
        return notes
    else:
        return []

# Update a note
def update_note(note_id, title=None, content=None):
    db = connect_db()
    users = db['users']

    updates = {}
    if title:
        updates["notes.$.title"] = title
    if content:
        updates["notes.$.content"] = content
    updates["notes.$.updated_at"] = datetime.now()

    result = users.update_one(
        {"notes._id": ObjectId(note_id)},
        {"$set": updates}
    )

    return result.modified_count > 0

# Delete a note permanently
def delete_note(note_id):
    db = connect_db()
    users = db['users']

    result = users.update_one(
        {"notes._id": ObjectId(note_id)},
        {"$pull": {"notes": {"_id": ObjectId(note_id)}}}
    )

    return result.modified_count > 0

# Searching for a note
# def search_notes(user_id, query):
#     return[]


################################################## NOTES ENDS

################################################## COLLECTION STARTS
# Create a new collection
def create_new_collection(user_id, collection_name):
    db = connect_db()
    users = db['users']

    try:
        user_obj_id = ObjectId(user_id)
    except Exception as e:
        print("Invalid user_id:", e)
        return False

    exists = users.find_one({
        "_id": user_obj_id,
        f"collections.{collection_name}": {"$exists": True}
    })

    if exists:
        print(f"Collection {collection_name} already exists.")
        return False

    result = users.update_one(
        { "_id": user_obj_id },
        {"$set": {
            f"collections.{collection_name}": {
                "notes": [],
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
        }},
        upsert=False
    )
    return result.modified_count > 0

# Add note to collection
def add_to_collection(user_id, collection_name, note):
    db = connect_db()
    users = db['users']

    try:
        user_obj_id = ObjectId(user_id)
    except Exception as e:
        print("Invalid user_id:", e)
        return False

    exists = users.find_one({
        "_id": user_obj_id,
        f"collections.{collection_name}.notes._id": note["_id"]
    })
    if exists:
        print("Note already exists in collection.")
        return False

    result = users.update_one(
        { "_id": user_obj_id },
        {
            "$push": {f"collections.{collection_name}.notes": note},
            "$set": {f"collections.{collection_name}.last_updated": datetime.now(timezone.utc).isoformat()}
        }
    )
    print("Add note result:", result.raw_result)
    return result.modified_count > 0

# Get collection
def get_collection(user_id):
    db = connect_db()

    try:
        user_obj_id = ObjectId(user_id)
    except Exception as e:
        print("Invalid user_id:", e)
        return False
    
    user = db.users.find_one(
        { "_id": user_obj_id },
        { "collections": 1, "_id": 0 }
    )

    if user and "collections" in user:
        return user["collections"]
    return None

# Delete entire collection
def delete_collection(user_id, collection_name):
    db = connect_db()
    
    try:
        user_obj_id = ObjectId(user_id)
    except Exception as e:
        print("Invalid user_id:", e)
        return False

    result = db.users.update_one(
        {"_id": user_obj_id},
        {"$unset": {f"collections.{collection_name}": ""}}
    )
    return result.modified_count > 0

# Remove note from collection
def remove_note_from_collection(user_id, collection_name, note_id):
    db = connect_db()

    try:
        user_obj_id = ObjectId(user_id)
    except Exception as e:
        print("Invalid user_id:", e)
        return False

    result = db.users.update_one(
        { "_id": user_obj_id },
        {
            "$pull": {f"collections.{collection_name}": {"_id": note_id}},
            "$set": {f"collections.{collection_name}.last_updated": datetime.now(timezone.utc).isoformat()}
        }
    )
    return result.modified_count > 0

################################################## COLLECTION ENDS

# Need to update later on detecting multiple identifiers
def detect_identifier_type(identifier):
    identifier = identifier.strip()

    if identifier.upper().startswith("PMC"):
        return "pmcid"

    if re.fullmatch(r"\d{7,8}", identifier): 
        return "pmid"

    if re.fullmatch(r"arXiv:\d{4}\.\d{4,5}(v\d+)?", identifier, re.IGNORECASE):
        return "arxiv"

    if identifier.lower().startswith("10.") or "/" in identifier:
        return "doi"

    return None


def fetch_metadata_by_identifier(identifier):
    id_type = detect_identifier_type(identifier)

    if id_type == "pmcid":
        id_val = identifier.replace("PMC", "")
        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&id={id_val}&retmode=json"
        fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id={id_val}&retmode=xml"

        summary_response = requests.get(summary_url)
        fetch_response = requests.get(fetch_url)

        if summary_response.ok and fetch_response.ok:
            summary_data = summary_response.json()
            result = summary_data['result'][id_val]
            root = ET.fromstring(fetch_response.text)

            abstract = ""
            for p in root.findall(".//abstract//p"):
                if p.text:
                    abstract += p.text.strip() + " "

            journal = result.get("source", "")
            pubdate = result.get("pubdate", "")
            year = pubdate.split()[0] if pubdate else None

            return {
                "title": result.get("title"),
                "authors": [a["name"] for a in result.get("authors", [])],
                "abstract": abstract.strip(),
                "journal": journal,
                "year": year,
                "pdf_url": "",
                "source_url": f"https://www.ncbi.nlm.nih.gov/pmc/articles/PMC{id_val}",
                "user_notes": "",
                "identifiers": {"pmcid": identifier},
                "annotations": []
            }

    elif id_type == "pmid":
        id_val = identifier.replace("PMID", "")
        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={id_val}&retmode=json"
        fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={id_val}&retmode=xml"

        summary_response = requests.get(summary_url)
        fetch_response = requests.get(fetch_url)

        if summary_response.ok and fetch_response.ok:
            summary_data = summary_response.json()
            result = summary_data['result'][id_val]
            root = ET.fromstring(fetch_response.text)

            abstract = ""
            for a in root.findall(".//AbstractText"):
                if a.text:
                    abstract += a.text.strip() + " "

            journal = result.get("source", "")
            pubdate = result.get("pubdate", "")
            year = pubdate.split()[0] if pubdate else None

            return {
                "title": result.get("title"),
                "authors": [a["name"] for a in result.get("authors", [])],
                "abstract": abstract.strip(),
                "journal": journal,
                "year": year,
                "pdf_url": "",
                "source_url": f"https://pubmed.ncbi.nlm.nih.gov/{id_val}",
                "user_notes": "",
                "identifiers": {"pmid": identifier},
                "annotations": []
            }

    elif id_type == "doi":
        url = f"https://api.crossref.org/works/{identifier}"
        response = requests.get(url)
        if response.ok:
            msg = response.json()['message']
            title = msg.get("title", [""])[0]
            authors = [f"{a.get('given', '')} {a.get('family', '')}" for a in msg.get("author", [])]
            abstract_html = msg.get("abstract", "")
            abstract = BeautifulSoup(abstract_html, "html.parser").get_text()
            journal = msg.get("container-title", [""])[0]

            published = (
                msg.get("published-print") or
                msg.get("published-online") or
                msg.get("created")
            )
            year = published.get("date-parts", [[None]])[0][0] if published else None

            return {
                "title": title,
                "authors": authors,
                "abstract": abstract.strip(),
                "journal": journal,
                "year": year,
                "pdf_url": msg.get("URL", ""),
                "source_url": f"https://doi.org/{identifier}",
                "user_notes": "",
                "identifiers": {"doi": identifier},
                "annotations": []
            }

    elif id_type == "arxiv":
        arxiv_id = identifier.split(":")[-1]
        url = f"http://export.arxiv.org/api/query?id_list={arxiv_id}"
        response = requests.get(url)

        if response.ok:
            root = ET.fromstring(response.text)
            entry = root.find("{http://www.w3.org/2005/Atom}entry")

            if entry is not None:
                title = entry.find("{http://www.w3.org/2005/Atom}title").text.strip()
                authors = [
                    author.find("{http://www.w3.org/2005/Atom}name").text
                    for author in entry.findall("{http://www.w3.org/2005/Atom}author")
                ]
                abstract = entry.find("{http://www.w3.org/2005/Atom}summary").text.strip()
                published = entry.find("{http://www.w3.org/2005/Atom}published").text
                year = published.split("-")[0] if published else None

                return {
                    "title": title,
                    "authors": authors,
                    "abstract": abstract,
                    "journal": "arXiv",
                    "year": year,
                    "pdf_url": entry.find("{http://www.w3.org/2005/Atom}id").text.replace("abs", "pdf"),
                    "source_url": f"https://arxiv.org/abs/{arxiv_id}",
                    "user_notes": "",
                    "identifiers": {"arxiv": identifier},
                    "annotations": []
                }

    return None

def fetch_abstract_by_id(source, uid):
    if source == "pubmed":
        fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={uid}&retmode=xml"
        try:
            response = requests.get(fetch_url)
            if response.ok:
                root = ET.fromstring(response.text)
                abstract_text = ""
                for a in root.findall(".//AbstractText"):
                    if a.text:
                        abstract_text += a.text.strip() + " "
                return abstract_text.strip()
        except Exception as e:
            print(f"[PubMed Abstract Fetch Error]: {e}")
            return ""
    elif source == "pmc":
        id_val = uid.replace("PMC", "")
        fetch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id={id_val}&retmode=xml"
        try:
            response = requests.get(fetch_url)
            if response.ok:
                root = ET.fromstring(response.text)
                abstract_text = ""
                for p in root.findall(".//abstract//p"):
                    if p.text:
                        abstract_text += p.text.strip() + " "
                return abstract_text.strip()
        except Exception as e:
            print(f"[PMC Abstract Fetch Error]: {e}")
            return ""
    return ""


def extract_identifiers_from_pdf(filepath):
    try:
        doc = pymupdf.open(filepath)
        text = ""
        for page in doc:
            text += page.get_text()

        doi_matches = re.findall(r'10\.\d{4,9}/[-._;()/:A-Za-z0-9]+', text)
        pmid_matches = re.findall(r'\bPMID[:\s]?(\d{5,})', text, flags=re.IGNORECASE)
        pmc_matches = re.findall(r'\bPMC\d{6,}', text, flags=re.IGNORECASE)
        arxiv_matches = re.findall(r'arXiv:\d{4}\.\d{4,5}', text, flags=re.IGNORECASE)

        return doi_matches + ['PMID' + p for p in pmid_matches] + pmc_matches + arxiv_matches
    except Exception as e:
        print("PDF parsing failed:", e)
        return []
    

def add_paper_to_library(user_id, metadata):
    db = connect_db()
    users = db['users']

    user = users.find_one({"username": user_id})
    if not user:
        raise ValueError("User not found")

    paper = {
        "_id": ObjectId(),
        **metadata,
        "uploaded_at": datetime.now()
    }

    users.update_one(
        {"_id": user["_id"]},
        {"$push": {"library": paper}}
    )

    return str(paper["_id"])

def get_user_library(user_id):
    db = connect_db()
    users = db['users']
    
    user = users.find_one({"username": user_id}, {"library": 1})
    if not user or "library" not in user:
        return []

    for paper in user['library']:
        if "_id" in paper:
            paper["_id"] = str(paper["_id"])
    return user["library"]

def update_user_paper(user_id, paper_id, updated_fields):
    print("uin here")
    db = connect_db()
    users = db['users']
    print("🔍 Looking for:")
    print("username =", user_id)
    print("paper_id =", paper_id)
    print("fields to update =", updated_fields)

    result = users.update_one(
        {"username": user_id, "library._id": ObjectId(paper_id)},
        {"$set": {f"library.$.{field}": value for field, value in updated_fields.items()}}
    )
    return result.modified_count > 0

def delete_user_paper(user_id, paper_id):
    db = connect_db()
    users = db['users']

    result = users.update_one(
        {"username": user_id},
        {
            "$pull": {
                "library": {
                    "$or": [
                        {"_id": ObjectId(paper_id)},
                        {"_id": paper_id}  # ← just in case it's saved as a string
                    ]
                }
            }
        }
    )
    return result.modified_count > 0



# Pulls all users and gets the infomation seen below
def pull_all_user():
    db = connect_db()
    users = db['users']
    userArr = []
    for user in users.find():
        userArr.append({
            "name": user["username"],
            "email": user["email"],
            "role": user["role"],
            "status": user["status"]
        })
    return userArr

def set_user_field(userEmail, field, value):
    db = connect_db()
    users = db['users']
    query = {"email": userEmail}
    newVal = {"$set": {field: value}}
    results = users.update_one(query,newVal)
    
    return results.modified_count > 0

def pull_all_notes():
    db = connect_db()
    users = db['users']
    userNotesArr = []
    for user in users.find():
        for note in user["notes"]:
            userNotesArr.append({
                "note_id": str(note["_id"]),
                "name": user["username"],
                "title": note["title"],
                "content": note["content"],
                "region": note["region"],
                "public": note["public"],
                "created": note["created_at"],
                "updated": note["updated_at"]
            })
    return userNotesArr

def set_note_public(noteId, value):
    db = connect_db()
    users = db['users']
    print(users.find_one({"notes._id": ObjectId(noteId)}))
    results = users.update_one({"notes._id": ObjectId(noteId)},{"$set": {"notes.$.public": value}})
    
    return results.modified_count > 0

# Just finds one right now
def find_public_notes(region):
    db = connect_db()
    users = db['users']
    notes = users.find_one({"notes.region": region})

    if not notes:
        return None
    notesArr = []
    print(notes["notes"])
    for note in notes["notes"]:
        if note["region"] == region and note["public"]:
            notesArr.append({
                "author": notes["username"],
                "title": note["title"],
                "content": note["content"]
            })
            
    if len(notesArr) == 0:
        return None
    return notesArr

def get_region_by_abbr(abbr):
    db = connect_db()
    return db['regions'].find_one({"abbreviations": abbr})

def paper_exists_in_library(user_id, reference_title):
    db = connect_db()
    users = db['users']
    user = users.find_one({"username": user_id}, {"library": 1})

    if not user or "library" not in user:
        return False

    for paper in user["library"]:
        if paper.get("title") == reference_title:
            return True

    return False

def get_all_library_titles(user_id):
    db = connect_db()
    users = db['users']
    user = users.find_one({"username": user_id}, {"library.title": 1})

    if not user or "library" not in user:
        return []

    return [paper.get("title") for paper in user["library"] if "title" in paper]

def extract_identifiers_from_url(url):
    ids = []
    match = re.search(r'(10\.\d{4,9}/[-._;()/:A-Za-z0-9]+)', url)
    if match:
        ids.append(match.group(1))
    return ids

def batch_check_titles_in_library(user_id, titles):
    db = connect_db()
    users = db['users']

    # Find the user and get their library titles
    user = users.find_one({"username": user_id}, {"library.title": 1})

    if not user or "library" not in user:
        return set()

    user_titles = {paper.get("title") for paper in user["library"] if "title" in paper}
    return user_titles.intersection(titles)



