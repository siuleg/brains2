from flask import Flask, request, jsonify, session
import requests
import os
from werkzeug.utils import secure_filename
import db_handler
from flask_cors import CORS
from flask import send_from_directory, make_response
from flask_session import Session
from dotenv import dotenv_values

app = Flask(__name__)
app.secret_key = os.urandom(12).hex() # Needed to sign session cookies and what not

UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), 'uploads'))
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
config = dotenv_values(".env")
SERPAPI_KEY = config.get("SERPAPI_KEY")


# Flask-Session configuration
app.config['SECRET_KEY'] = os.urandom(12).hex()
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './flask_session'  
app.config['SESSION_PERMANENT'] = False  # Disable permanent sessions
app.config['SESSION_USE_SIGNER'] = True  # To add an extra layer of security
Session(app)

@app.route('/whoami', methods=['GET'])
def whoami():
    print(session.get("userId"))
    if session.get("userId") != None:
        result, role = db_handler.whoami(session.get("userId"))
        print(request)
        return jsonify({"message": result, "role": role}), 200
    return jsonify({'error': "Not Signed In"}), 400


@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query')
    database = request.args.get('db', 'pmc')
    page = int(request.args.get('page', 1))  # Default to page 1
    retmax = 50
    retstart = (page - 1) * retmax

    mindate = request.args.get('start_date')  # Expected format: YYYY/MM/DD
    maxdate = request.args.get('end_date')    # Expected format: YYYY/MM/DD

    #print(f"Received query: {query}, Database: {database}, Page: {page}, Start: {mindate}, End: {maxdate}")
    if not query:
        return jsonify({'error': 'No query provided'}), 400

    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    params = {
        'db': database,
        'term': query,
        'retmode': 'json',
        'retmax': retmax,
        'retstart': retstart
    }

    # Add date filters if provided
    if mindate and maxdate:
        params['mindate'] = mindate
        params['maxdate'] = maxdate
        params['datetype'] = 'pdat'  # Filter by publication date

    print(f"Requesting NCBI with URL: {base_url} and params: {params}")
    response = requests.get(base_url, params=params)
    print(f"NCBI Response: {response.text}")

    esearch_data = response.json().get('esearchresult', {})
    id_list = esearch_data.get('idlist', [])
    total_results = int(esearch_data.get('count', 0))

    print(f"ID list received: {id_list}")

    if id_list:
        details_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        details_params = {
            'db': database,
            'id': ','.join(id_list),
            'retmode': 'json'
        }
        details_response = requests.get(details_url, params=details_params)
        articles = details_response.json()
        print(f"Article details fetched: {articles}")

        user_id = session.get("userId")  # ⬅️ Get the logged-in user's ID from session

        # # Add alreadyAdded field for each result
        # for key, article in articles['result'].items():
        #     if isinstance(article, dict) and 'title' in article:
        #         already = db_handler.paper_exists_in_library(user_id, article['title']) if user_id else False
        #         article['alreadyAdded'] = already

        if user_id:
            titles_to_check = [
                article['title']
                for article in articles['result'].values()
                if isinstance(article, dict) and 'title' in article
            ]
            already_added_titles = db_handler.batch_check_titles_in_library(user_id, titles_to_check)

            for key, article in articles['result'].items():
                if isinstance(article, dict) and 'title' in article:
                    article['alreadyAdded'] = article['title'] in already_added_titles

        return jsonify({
            'results': articles,
            'pagination': {
                'current_page': page,
                'per_page': retmax,
                'total_results': total_results,
                'total_pages': (total_results + retmax - 1) // retmax
            }
        })

    else:
        return jsonify({'message': 'No articles found'}), 404


    

@app.route('/search-one', methods=['GET'])
def searchOneResult():
    query = request.args.get('query')
    database = request.args.get('db', 'pmc') 
    print(f"Received query: {query}, Database: {database}") 
    if not query:
        return jsonify({'error': 'No query provided'}), 400

    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    params = {
        'db': database,
        'term': query,
        'retmode': 'json',
        'retmax': 50  
    }
    print(f"Requesting NCBI with URL: {base_url} and params: {params}") 
    response = requests.get(base_url, params=params)
    print(f"NCBI Response: {response.text}")
    id_list = response.json().get('esearchresult', {}).get('idlist', [])
    print(f"ID list received: {id_list}") 

    if id_list:
        # Fetching details for each article ID
        details_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        details_params = {'db': database, 'id': ','.join(id_list), 'retmode': 'json'}
        details_response = requests.get(details_url, params=details_params)
        articles = details_response.json()
        print(f"Article details fetched: {articles}")
        print(type(articles['result']))
        print(articles['result'][min(articles['result'].keys())])
        return jsonify(articles['result'][min(articles['result'].keys())])
    else:
        return jsonify({'message': 'No articles found'}), 404

      
@app.route('/get_endnote', methods=['GET'])
def get_endnote():
    abbreviation = request.args.get('abbr')

    if not abbreviation:
        return jsonify({'error': 'No abbreviation provided'}), 400

    db = db_handler.connect_db()
    collection = db['regions']

    region_data = collection.find_one({'abbreviations': {'$regex': f'^{abbreviation}$', '$options': 'i'}}, {'_id': 0})

    if not region_data:
        return jsonify({'error': f'Region with abbreviation "{abbreviation}" not found'}), 404

    return jsonify({
        'abbreviation': abbreviation,
        'names': region_data['names'],  
        'endnotes': region_data.get('endnotes', [])
    })

  
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Missing data'}), 400

    error, msgId = db_handler.register_user(username, email, password)
    if error:
        return jsonify({'error': msgId}), 409

    session["userId"] = msgId
    print(session.get("userId"))
    return jsonify({'message': 'User registered successfully', 'user_id': str(msgId)}), 201

  
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400

    result, role = db_handler.login_user(email, password)
    if result:
        if result == "Wrong Password" or result == "Blocked Account":
            return jsonify({'error': result}), 401  # Incorrect password
        else:
            session["userId"] = result
            session["role"] = role
            print(session.get("userId"))
            print(session.get("role"))
            return jsonify({'message': 'Login successful', 'user_id': result}), 200  # Successful login
    else:
        return jsonify({'error': 'User not found'}), 404  # User does not exist
    
@app.route('/logout', methods=['Get'])
def logout():
    print(session["userId"])
    session["userId"] = None
    session['role'] = None
    print(session["userId"])
    return jsonify({"message": "Logout was successful"}), 200

################################################## NOTES START
# Fetching all notes
@app.route('/notes', methods=['GET'])
def get_notes():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    notes = db_handler.get_notes(user_id)
    return jsonify(notes), 200

# Creating a new note
@app.route('/notes/create', methods=['POST'])
def create_note():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    user_id = data.get('user_id')
    region = data.get('region')

    if not title or not content or not user_id:
        return jsonify({'error': 'Missing required fields'}), 400

    note_id = db_handler.create_note(title, content, user_id, region)
    return jsonify({'message': 'Note created successfully', 'note_id': note_id}), 201
  
# Editing an existing note
@app.route('/notes/update/<note_id>', methods=['PUT'])
def update_note(note_id):
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')

    if not title and not content:
        return jsonify({'error': 'No update fields provided'}), 400

    success = db_handler.update_note(note_id, title, content)
    if success:
        return jsonify({'message': 'Note updated successfully'}), 200
    else:
        return jsonify({'error': 'Update failed'}), 500
    
# Deleting an existing note   
@app.route('/notes/delete/<note_id>', methods=['DELETE'])
def delete_note(note_id):
    success = db_handler.delete_note(note_id)
    if success:
        return jsonify({'message': 'Note deleted successfully'}), 200
    else:
        return jsonify({'error': 'Delete failed'}), 500
    
# Searching for an existing note   
@app.route('/notes/search', methods=['GET'])
def search_notes():
    user_id = request.args.get('user_id')
    query = request.args.get('query')
    
    if not user_id or not query:
        return jsonify({'error'}), 400
    
    notes = db_handler.search_notes(user_id, query)
    return jsonify(notes), 200
    
################################################## NOTES END

################################################## COLLECTION STARTS
# Creating a new collection
@app.route('/collections', methods = ['POST'])
def create_new_collection():
    user_id = session.get("userId")
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401

    data = request.get_json()
    collection_name = data.get("collectionName")

    if not collection_name:
        return jsonify({'error': 'Collection name is missing, required to continue.'}), 400
    
    # DELETE FOR DEBUGGING
    print(f"CREATING A COLL FOR USER ID: {user_id}")
    print(f"COLLECTION NAME: {collection_name}")
    
    success = db_handler.create_new_collection(user_id, collection_name)
    if success:
        return jsonify({'message': f'Collection {collection_name} created successfully'}), 201
    else:
        return jsonify({'error': f'Failed to create collection {collection_name}'}), 400

# Adding a note to a collection
@app.route('/collections/add', methods=['POST'])
def add_to_collection():
    user_id = session.get("userId")
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401

    data = request.get_json()
    note = data.get('note')
    collection_name = data.get('collectionName')

    if not note or not collection_name:
        return jsonify({'error': 'Note and collection name are required'}), 400
    
    # If the collection already exists add the note to it
    success = db_handler.add_to_collection(user_id, collection_name, note)
    if success:
        return jsonify({'message': f'Note added to {collection_name}'}), 200
    else:
        return jsonify({'error': f'Note is already saved to {collection_name}'}), 400

# Fetching the collection
@app.route('/collections', methods=['GET'])
def get_collection():
    user_id = session.get("userId")
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401

    collection = db_handler.get_collection(user_id)
    if collection is not None:
        return jsonify({'collection': collection}), 200
    else:
        return jsonify({'error': f'Collections not found'}), 404

# Deleting the collection
@app.route('/collections/<collection_name>', methods=['DELETE'])
def delete_collection(collection_name):
    user_id = session.get("userId")
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401

    response = db_handler.delete_collection(user_id, collection_name)
    
    if response:       
        return jsonify({'message': f'Collection {collection_name} deleted successfully'}), 200    
    else:       
        return jsonify({'error': f'Failed to delete collection {collection_name}'}), 404
    
# Remove note from a collection
@app.route('/collections/<collection_name>/remove', methods=['DELETE'])
def remove_note_from_collection(collection_name):
    user_id = session.get("userId")
    if not user_id:
        return jsonify({'error': 'User not authenticated'}), 401

    data = request.get_json()
    note_id = data.get('noteID')

    if not note_id:
        return jsonify({'error': 'Missing noteID'}), 400
    
    response = db_handler.remove_note_from_collection(user_id, collection_name, note_id)
    if response:       
        return jsonify({'message': f'Note removed successfully from {collection_name}'}), 200    
    else:       
        return jsonify({'error': f'Failed to remove note from {collection_name}'}), 400

################################################## COLLECTION ENDS

@app.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    response = make_response(send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False))
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Cross-Origin-Resource-Policy', 'cross-origin')  # Optional but helps
    return response
# @app.route('/uploads/<path:filename>')
# def serve_uploaded_file(filename):
#     from flask import abort
#     full_path = os.path.join(UPLOAD_FOLDER, filename)

#     if not os.path.exists(full_path):
#         return abort(404)

#     return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)

#only pdf files for now
@app.route('/library/upload', methods=['POST'])
def upload_paper():
    user_id = request.form.get('user_id')
    identifier = request.form.get('identifier') 
    paper_file = request.files.get('file')      
    metadata = None

    # Case 1: Identifier is provided (from input box)
    if identifier:
        metadata = db_handler.fetch_metadata_by_identifier(identifier)

    # Case 2: File uploaded, try to extract identifier from it
    elif paper_file:
        filename = secure_filename(paper_file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        paper_file.save(filepath)

        extracted_ids = db_handler.extract_identifiers_from_pdf(filepath)
        for id_candidate in extracted_ids:
            metadata = db_handler.fetch_metadata_by_identifier(id_candidate)
            if metadata:
                #metadata["pdf_url"] = filepath
                #need to change this to not be hardcoded
                #metadata["pdf_url"] = f"http://127.0.0.1:5000/uploads/{filename}"
                metadata["pdf_url"] = request.host_url.rstrip('/') + f"/uploads/{filename}"

                break

        if not metadata:
            # fallback metadata
            metadata = {
                "title": filename,
                "authors": [],
                "abstract": "Could not extract metadata.",
                "pdf_url": filepath,
                "user_notes": "",
                "identifiers": {}
            }

    if metadata:
        paper_id = db_handler.add_paper_to_library(user_id, metadata)
        return jsonify({"message": "Paper uploaded", "paper_id": paper_id}), 201
    else:
        return jsonify({"error": "Failed to upload or extract metadata"}), 400

@app.route('/library', methods=['GET'])
def get_library():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    library = db_handler.get_user_library(user_id)
    return jsonify(library), 200

@app.route('/library/update/<paper_id>', methods=['PUT'])
def update_paper(paper_id):
    data = request.json
    user_id = data.get('user_id') 
    print("oops")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    # Remove these fields from the payload
    updated_fields = {
        k: v for k, v in data.items()
        if k not in ['user_id', '_id']
    }

    success = db_handler.update_user_paper(user_id, paper_id, updated_fields)
    return jsonify({"success": success}), 200

@app.route('/library/delete/<paper_id>', methods=['DELETE'])
def delete_paper(paper_id):
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    success = db_handler.delete_user_paper(user_id, paper_id)
    if success:
        return jsonify({"success": True}), 200
    return jsonify({"success": False, "error": "Deletion failed"}), 404

@app.route('/get-all-users', methods=['GET'])
def get_all_users():
    users = db_handler.pull_all_user()
    print(users)
    return jsonify({'message': users})

@app.route('/field-update', methods=['POST'])
def field_update():
    data = request.get_json()
    userEmail = data.get('email')
    field = data.get('field')
    value = data.get('value')
    
    if not (userEmail and field):
        return jsonify({'error': 'Missing required Fields'}), 400
    
    result = db_handler.set_user_field(userEmail, field, value)
    if result:
        return jsonify({'message': "Field was successfully updated"}), 201
    return jsonify({'error': 'failed to update field'}), 400

@app.route('/get-all-notes', methods=['GET'])
def get_all_notes():
    notes = db_handler.pull_all_notes()
    return jsonify({'message': notes})

@app.route('/public-update', methods=['POST'])
def public_update():
    data = request.get_json()
    noteId = data.get('noteid')
    value = data.get('value')
    print(value)
    if not noteId:
        return jsonify({'error': 'Missing required Fields'}), 400
    
    result = db_handler.set_note_public(noteId, value)
    if result:
        return jsonify({'message': "Note public status was changed"}), 201
    return jsonify({'error': 'failed to change'}), 400

@app.route('/find-public-notes', methods=['POST'])
def find_public_notes():
    data = request.get_json()
    region = data.get('region')
    print(region)
    if not region:
        return jsonify({'error': 'Missing required Fields'}), 400
    
    result = db_handler.find_public_notes(region)
    if result:
        return jsonify({'message': result}), 201
    return jsonify({'error': 'No pubilc notes found on this region'}), 400
    
@app.route("/region-papers-by-abbr/<abbr>", methods=["GET"])
def get_region_papers_by_abbr(abbr):
    region = db_handler.get_region_by_abbr(abbr)
    user_id = request.args.get('user_id')
    if not region:
        return jsonify({"error": "Region not found"}), 404

    references = region.get("references", [])
    if not references:
        return jsonify({"error": "No references found for this region."}), 404

    results = []
    for ref in references:
        params = {
            "engine": "google_scholar",
            "q": ref,
            "api_key": SERPAPI_KEY
        }
        response = requests.get("https://serpapi.com/search", params=params)

        if response.status_code == 200:
            data = response.json()
            top_result = data.get("organic_results", [])[0] if data.get("organic_results") else {}
            title = top_result.get("title") if top_result else None
            already_added = db_handler.paper_exists_in_library(user_id, title) if user_id and title else False
            results.append({
                "reference": ref,
                "title": top_result.get("title"),
                "link": top_result.get("link"),
                "snippet": top_result.get("snippet"),
                "alreadyAdded": already_added
            })
        else:
            results.append({
                "reference": ref,
                "error": f"Failed to retrieve result. Status: {response.status_code}"
            })

    return jsonify({"papers": results})

@app.route('/library/add-region-paper', methods=['POST'])
def add_region_paper_to_library():
    data = request.json
    user_id = data.get('user_id')
    title = data.get('title')
    link = data.get('link')
    reference = data.get('reference')

    if not user_id or not title or not link:
        return jsonify({"error": "Missing required fields"}), 400

    if db_handler.paper_exists_in_library(user_id, title):
        return jsonify({"message": "Paper already in your library."}), 200

    # Try to extract identifier (e.g., DOI) from the link
    extracted_ids = db_handler.extract_identifiers_from_url(link)
    metadata = None

    for identifier in extracted_ids:
        metadata = db_handler.fetch_metadata_by_identifier(identifier)
        if metadata:
            break
    pdf_url = None
    
    if metadata:
        metadata["pdf_url"] = None

    if not metadata:
        # fallback basic metadata
        metadata = {
            "title": title,
            "authors": [],
            "abstract": f"Auto-added from region reference: {reference}",
            "source_url": link,  
            "pdf_url": pdf_url,     
            "user_notes": "",
            "identifiers": {"source": "reference"}
        }

    paper_id = db_handler.add_paper_to_library(user_id, metadata)
    return jsonify({"message": "Paper added to library", "paper_id": paper_id}), 200

@app.route('/library/add-pubmed-paper', methods=['POST'])
def add_pubmed_paper_to_library():
    data = request.json
    user_id = data.get('user_id')
    title = data.get('title')
    source = data.get('source')  # "pubmed" or "pmc"
    uid = data.get('uid')  # PMID or PMCID
    authors = data.get('authors', [])
    journal = data.get('journal', '')
    pubdate = data.get('year', '')
    year = pubdate.split()[0] if pubdate else ''
    abstract = data.get('abstract', '')

    if not user_id or not title or not uid or not source:
        return jsonify({"error": "Missing required fields"}), 400

    if db_handler.paper_exists_in_library(user_id, title):
        return jsonify({"message": "Paper already in your library."}), 200

    # If no abstract provided, fetch it now
    if not abstract:
        abstract = db_handler.fetch_abstract_by_id(source, uid)

    pdf_url = None
    source_url = f"https://www.ncbi.nlm.nih.gov/{'pubmed' if source == 'pubmed' else 'pmc/articles'}/{uid}"

    metadata = {
        "title": title,
        "authors": authors,
        "abstract": abstract or f"Auto-added from {source} entry: {uid}",
        "pdf_url": pdf_url,
        "source_url": source_url,
        "user_notes": "",
        "identifiers": {
            "source": source,
        },
        "journal": journal,
        "year": year 
    }

    paper_id = db_handler.add_paper_to_library(user_id, metadata)
    return jsonify({"message": "Paper added to library", "paper_id": paper_id}), 200

if __name__ == '__main__':
    app.run(debug=True)
