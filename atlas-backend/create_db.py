import db_handler

reference_txt_path = 'all_references.txt'
doc_file = "C-CNS regions (rat 4.0).docx"

if __name__ == "__main__":
    #reference_map = db_handler.load_reference_mappings("all_references.txt")
    #db_handler.update_regions_with_docx_refs(doc_file, reference_map)
    reference_map = db_handler.load_reference_mappings(reference_txt_path)
    load_message = db_handler.load_regions_from_docx(doc_file, reference_map)