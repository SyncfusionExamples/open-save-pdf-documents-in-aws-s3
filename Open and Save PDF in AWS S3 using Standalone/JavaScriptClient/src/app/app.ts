import { PdfViewer, CustomToolbarItemModel, Toolbar, Magnification, Navigation, Annotation, LinkAnnotation, ThumbnailView, BookmarkView, TextSelection, TextSearch, FormFields, FormDesigner} from '@syncfusion/ej2-pdfviewer';
import * as AWS from 'aws-sdk';

AWS.config.update({
  region: 'us-west-2', // Update this your region
  accessKeyId: 'AKIASCRGFNWJIEN2KEGU', // Update this with your access key id
  secretAccessKey: 'PteGreuiwqONGiFPpZshuTvvivGMgN5l4SLGdmj/', // Update this with your secret access key
});

PdfViewer.Inject(Toolbar, Magnification, Navigation, Annotation, LinkAnnotation, ThumbnailView, BookmarkView, TextSelection, TextSearch, FormFields, FormDesigner);

let pdfviewer: PdfViewer = new PdfViewer();
pdfviewer.resourceUrl = "https://cdn.syncfusion.com/ej2/23.1.43/dist/ej2-pdfviewer-lib";

let toolItem1: CustomToolbarItemModel = {
    prefixIcon: 'e-icons e-pv-download-document-icon',
    id: 'download_pdf',
    tooltipText: 'Download file',
    align: 'right'
};

pdfviewer.toolbarSettings = { toolbarItems: [ 'OpenOption', 'PageNavigationTool', 'MagnificationTool', 'PanTool', 'SelectionTool', 'SearchOption', 'PrintOption', toolItem1, 'UndoRedoTool', 'AnnotationEditTool', 'FormDesignerEditTool', 'CommentTool', 'SubmitForm']}

pdfviewer.toolbarClick = function (args) {
    if (args.item && args.item.id === 'download_pdf') {
        saveDocument();
    }
};

let s3 = new AWS.S3();

pdfviewer.created = function () {
    const getObjectParams = {
        Bucket: 'Update this with your bucket name',
        Key: 'Update this with your key name',
    };
    s3.getObject(getObjectParams, (err, data) => {
        if (err) {
            console.error('Error fetching document:', err);
        } else {
        if (data && data.Body) {
            const bytes = new Uint8Array(data.Body as ArrayBuffer);
            let binary = '';
            bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
            const base64String = window.btoa(binary);
            setTimeout(() => {
                pdfviewer.load("data:application/pdf;base64,"+base64String, "");
            }, 2000);
        }
        }
    });
}

function saveDocument() {
    pdfviewer.saveAsBlob().then((value: Blob) => {
        const reader = new FileReader();
        reader.onload = () => {
        const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
        const putObjectParams = {
            Bucket: 'Update this with your bucket name',
            Key: 'Update this with your key name',
            Body: uint8Array,
            ContentType: 'application/pdf',
        };
        s3.putObject(putObjectParams, (err, data) => {
            if (err) {
                console.error('Error uploading document:', err);
            } else {
                console.log('Document uploaded successfully:', data);
            }
        });
        };
        reader.readAsArrayBuffer(value);
    });
}

pdfviewer.appendTo('#PdfViewer');