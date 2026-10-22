// h3 answers with the status of whatever is thrown, and CMS SDKs attach the HTTP status of the CMS
// (401 for a bad token, 404 for an unknown project). A failing CMS request is a server error of
// this app, and must not look like missing content.
export async function cmsRequest<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw createError({ statusCode: 500, statusMessage: "CMS request failed", cause: error });
  }
}
