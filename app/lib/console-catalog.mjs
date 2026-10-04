// Documentation allowlist. This is deliberately not an arbitrary API proxy.
const endpoint = (id, group, method, path, title, purpose) => ({ id, group, method, path, title, purpose });
export const API_CATALOG = {
  pdq: [
    endpoint('report', 'Reports', 'POST', '/complaint/report', 'Register a report', 'Register confirmed image references for matching against platform content.'),
    endpoint('withdraw-report', 'Reports', 'POST', '/complaint/report/withdraw', 'Withdraw a report', 'Withdraw this platform’s claims for a reported reference.'),
    endpoint('counts', 'Reference library', 'GET', '/hashes/count', 'Reference hash counts', 'Read confirmed hash counts. These are not platform archive counts.'),
    endpoint('case', 'Detection cases', 'GET', '/cases/{case_uuid}', 'Inspect a case', 'Read a detection case’s lifecycle, action and storage references.'),
    endpoint('confirm', 'Detection cases', 'POST', '/cases/{case_uuid}/confirm', 'Confirm removal', 'Confirm that the matched content has been removed from all storage layers.'),
    endpoint('withdraw-case', 'Detection cases', 'POST', '/cases/{case_uuid}/withdraw', 'Withdraw a case', 'Withdraw a detection case with a recorded reason.'),
    endpoint('audit', 'Detection cases', 'GET', '/cases/{case_uuid}/audit', 'Read the audit trail', 'Inspect the case’s events and audit-chain verification.'),
  ],
  pulse: [
    endpoint('report', 'Reports', 'POST', '/complaint/pulse', 'Register a report', 'Register an image URL or an authorized, precomputed DINOv2 embedding.'),
    endpoint('reports', 'Reports', 'GET', '/complaint/pulse', 'List active reports', 'Read this platform’s active Pulse complaints.'),
    endpoint('report-detail', 'Reports', 'GET', '/complaint/pulse/{complaint_id}', 'Inspect a report', 'Read complaint lifecycle and linked scan state.'),
    endpoint('withdraw', 'Reports', 'DELETE', '/complaint/pulse/{complaint_id}', 'Withdraw a report', 'Withdraw a complaint and initiate its associated cleanup.'),
    endpoint('create-job', 'Storage backfills', 'POST', '/v2/pulse/storage-jobs', 'Create a backfill', 'Create a library backfill or a complaint scan for a configured storage integration.'),
    endpoint('register-items', 'Storage backfills', 'POST', '/v2/pulse/storage-jobs/{job_id}/items', 'Register items', 'Register storage object identities before sealing the job.'),
    endpoint('items', 'Storage backfills', 'GET', '/v2/pulse/storage-jobs/{job_id}/items', 'Inspect items', 'Page through registered items and their processing state.'),
    endpoint('seal', 'Storage backfills', 'POST', '/v2/pulse/storage-jobs/{job_id}/seal', 'Seal a backfill', 'Finalize the registered inventory for processing.'),
    endpoint('job', 'Storage backfills', 'GET', '/v2/pulse/storage-jobs/{job_id}', 'Inspect a backfill', 'Read job state, registration totals and item counts.'),
    endpoint('cancel', 'Storage backfills', 'POST', '/v2/pulse/storage-jobs/{job_id}/cancel', 'Cancel a backfill', 'Request cancellation of an eligible storage job.'),
    endpoint('upsert', 'Library', 'POST', '/pulse/library/batch-upsert', 'Index precomputed vectors', 'Register platform library embeddings in a batch.'),
    endpoint('delete', 'Library', 'DELETE', '/pulse/library/{platform_content_id}', 'Remove a library item', 'Remove the identified content from the platform’s vector library.'),
    endpoint('upsert-url', 'URL scans', 'POST', '/pulse/library/batch-upsert-url', 'Index image URLs', 'Submit platform image URLs for asynchronous library indexing.'),
    endpoint('scan', 'URL scans', 'POST', '/pulse/scan/submit', 'Submit a complaint scan', 'Submit an image URL inventory to scan against an existing complaint.'),
    endpoint('url-job', 'URL scans', 'GET', '/pulse/library/jobs/{job_id}', 'Inspect a URL job', 'Read asynchronous URL-job progress.'),
  ],
};

export function filterOpenApi(schema, family) {
  if (!Object.hasOwn(API_CATALOG, family) || !schema?.paths) throw new Error('schema_unavailable');
  const paths = {};
  const schemas = {};
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.$ref === 'string' && value.$ref.startsWith('#/components/schemas/')) {
      const name = value.$ref.slice('#/components/schemas/'.length);
      if (!Object.hasOwn(schemas, name) && schema.components?.schemas?.[name]) {
        schemas[name] = schema.components.schemas[name];
        visit(schemas[name]);
      }
    }
    Object.values(value).forEach(visit);
  };
  for (const entry of API_CATALOG[family]) {
    // FastAPI's OpenAPI normally removes the :path converter.
    const source = schema.paths[entry.path] || schema.paths[entry.path.replace('{platform_content_id}', '{platform_content_id:path}')];
    const operation = source?.[entry.method.toLowerCase()];
    if (!operation) continue;
    const { requestBody, responses, parameters, summary, description } = operation;
    const safe = { requestBody, responses, parameters: [...(source.parameters || []), ...(parameters || [])], summary, description };
    visit(safe);
    paths[entry.path] ||= {};
    paths[entry.path][entry.method.toLowerCase()] = safe;
  }
  return { openapi: schema.openapi, paths, components: { schemas } };
}

export const reportHref = (kind, reference) => `/console/cases/${kind}/${encodeURIComponent(reference)}`;
export const jobHref = (kind, id) => `/console/scans/${kind}/${encodeURIComponent(id)}`;
