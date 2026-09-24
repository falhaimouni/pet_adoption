# Bulk PDF operations

Both endpoints require a JWT and an ADMIN, MANAGER, or VET role. Maximum batch size: 20.

## Import medical data

POST /pets/:petId/medical-record/import/bulk

Send multipart/form-data with repeated files fields containing PDFs (10 MB maximum per PDF).
Each PDF uses the existing labeled-field parser and row validation. Supported labels include
Diagnosis:, Treatment:, Medical Date:, Vaccine Name:, and Vaccination Date:.
Successful imports also retain the PDF as a document attached to the pet medical record.

Files are processed independently. A PDF with valid and invalid rows imports its valid rows.
The response contains total, imported (files with at least one imported row), failed (files
with no successful import), partial (a subset of imported files with rejected rows),
importedRows, and results. Each result identifies the input index and fileName and contains
either the existing import summary (including fileId and row errors) or statusCode and error.

Missing files return HTTP 400. Multipart type/size/count violations reject the request.
Per-file processing failures are reported in results; check results even for an HTTP success.

## Delete PDF documents

DELETE /files/documents/bulk

Send application/json: {"fileIds":["<document UUID>","<document UUID>"]}.
IDs must be unique UUIDs. Empty batches and batches over 20 are rejected.
The response contains total, deleted, failed, and results with each fileId and success.
Failed items include statusCode and error. Non-PDF files cannot be deleted through this endpoint.
Deletion removes the physical PDF and its file record, preserving medical entries and vaccinations.
Each deletion uses the existing physical-file recovery behavior if database deletion fails.

Bulk operations are not atomic across the batch. Retry failed items only; reimporting a successful
PDF creates additional medical rows because the existing importer does not deduplicate imports.
