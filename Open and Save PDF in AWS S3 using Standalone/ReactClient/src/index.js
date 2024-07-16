import * as ReactDOM from 'react-dom';
import * as React from 'react';
import './index.css';
import { PdfViewerComponent, Toolbar, Magnification, Navigation, LinkAnnotation, BookmarkView,
         ThumbnailView, Print, TextSelection, Annotation, TextSearch, FormFields, FormDesigner, Inject} from '@syncfusion/ej2-react-pdfviewer';
import AWS from 'aws-sdk';

AWS.config.update({
  region: 'update this your region',
  accessKeyId: 'Update this with your access key id', 
  secretAccessKey: 'Update this with your secret access key',
});

function App() {
  let viewer;
  const s3 = new AWS.S3();

  var toolItem1 = {
    prefixIcon: 'e-icons e-pv-download-document-icon',
    id: 'download_pdf',
    tooltipText: 'Download file',
    align: 'right'
  };

  function toolbarClick(args){
    if (args.item && args.item.id === 'download_pdf') {
      saveDocument();
    }
  };

  function loadDocument() {
    const getObjectParams = {
      Bucket: 'Update this with your bucket name', // Specify the name of your S3 bucket
      Key: 'Update this with your key name', // Specify the key (path) of your document in the S3 bucket
    };
    s3.getObject(getObjectParams, (err, data) => {
      if (err) {
        console.error('Error fetching document:', err);
      } else {
        if (data && data.Body) {
          const bytes = new Uint8Array(data.Body);
          let binary = '';
          bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
          const base64String = window.btoa(binary);
          setTimeout(() => {
            viewer.load("data:application/pdf;base64,"+base64String);
          }, 2000);
        }
      }
    });
  };

  function saveDocument() {
    viewer.saveAsBlob().then(function (value) {
      var reader = new FileReader();
      reader.onload = () => {
        const uint8Array = new Uint8Array(reader.result);
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
  };
    return (<div>
    <div className='control-section'>
    {/* Render the PDF Viewer */}
      <PdfViewerComponent
        ref={(scope) => {
          viewer = scope;
        }}
        created={loadDocument}
        id="container"
        resourceUrl="https://cdn.syncfusion.com/ej2/23.1.40/dist/ej2-pdfviewer-lib"
        style={{ 'height': '640px' }}
        toolbarSettings={{ showTooltip : true, toolbarItems: [ 'OpenOption', 'PageNavigationTool', 'MagnificationTool', 'PanTool', 'SelectionTool', 'SearchOption', 'PrintOption', toolItem1, 'UndoRedoTool', 'AnnotationEditTool', 'FormDesignerEditTool', 'CommentTool', 'SubmitForm']}}
            toolbarClick={toolbarClick}
        >
         
         <Inject services={[ Toolbar, Magnification, Navigation, Annotation, LinkAnnotation, BookmarkView,
                             ThumbnailView, Print, TextSelection, TextSearch, FormFields, FormDesigner ]}/>

      </PdfViewerComponent>
    </div>
  </div>);
}

const root = ReactDOM.createRoot(document.getElementById('sample'));
root.render(<App />);