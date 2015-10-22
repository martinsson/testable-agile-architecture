
function PdfUtility() {
    return {
        getPdfInfo: function (pdfAbsolutePath) {
            return {
                language: "en-US", numberOfPages: 6,
                width: 300, height: 500
            }
        }
    }
}