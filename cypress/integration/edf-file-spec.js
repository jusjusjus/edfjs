
/** Test the ability to load a page
 *
 * - tests the page loads
 * - tests ability to open .edf file
 */
describe('starting page', () => {

  const filename = "sample.edf";

  it(`loads ${filename}`, () => {
    cy.visit('/web/index.html');
    cy.fixture(filename, 'binary')
      .then(Cypress.Blob.binaryStringToBlob)
      .then((fileContent) => {
        cy.get('#fileSelector').attachFile({
          fileContent,
          filePath: filename,
          mimeType: 'application/octet-stream',
          encoding: 'utf8'
        });
      });
  });
});
