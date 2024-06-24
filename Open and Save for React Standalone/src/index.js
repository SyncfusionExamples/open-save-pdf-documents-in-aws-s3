import * as ReactDOM from 'react-dom';
import * as React from 'react';
import './index.css';
import AWS from 'aws-sdk';
import {
  PdfViewerComponent, Toolbar, Magnification, Navigation, LinkAnnotation, BookmarkView,
  ThumbnailView, Print, TextSelection, Annotation, TextSearch, FormFields, FormDesigner, Inject
} from '@syncfusion/ej2-react-pdfviewer';
AWS.config.update({
  region: 'us-east-1', // Specify your AWS region
  accessKeyId: "Specify your AWS access key ID",
  secretAccessKey: "Specify your AWS secret access key"
});
function App() {
  let viewer;
  const s3 = new AWS.S3();
  const loadDocument = () => {
    const getObjectParams = {
      Bucket: 'Specify the name of your S3 bucket',
      Key: 'Specify the key (path) of your document in the S3 bucket'
    };
    s3.getObject(getObjectParams, (err, data) => {
      if (err) {
        console.error('Error fetching document:', err);
      } else {
        const base64String = Buffer.from(data.Body).toString('base64');
        console.log('Document data as Base64:', base64String);
        viewer.load('data:application/pdf;base64,' + base64String);
      }
    });
  };

  const saveDocument = () => {
    viewer.saveAsBlob().then(function (value) {
      var reader = new FileReader();
      reader.onload = () => {
        // Convert ArrayBuffer to Uint8Array
        const uint8Array = new Uint8Array(reader.result);

        // Specify parameters for putObject method
        const putObjectParams = {
          Bucket: 'Specify the name of your S3 bucket',
          Key: 'Specify the key (path) of your document in the S3 bucket',
          Body: uint8Array,
          ContentType: 'application/pdf',
        };

        // Use putObject method to upload the PDF document
        s3.putObject(putObjectParams, (err, data) => {
          if (err) {
            console.error('Error uploading document:', err);
          } else {
            console.log('Document uploaded successfully:', data);
            // Handle success
          }
        });
      };
      reader.readAsArrayBuffer(value);
    });
  };
  return (
    <div>
      <br></br><br></br><br></br>
      <button onClick={loadDocument}>LoadDocument </button>
      <button onClick={saveDocument}>SaveDocument </button>
      <div className='control-section'>
        <PdfViewerComponent
          id="container"
          ref={(scope) => {
            viewer = scope;
          }}
          resourceUrl = "https://cdn.syncfusion.com/ej2/26.1.38/dist/ej2-pdfviewer-lib"
          style={{ 'height': '640px' }}>
          <Inject services={[Toolbar, Magnification, Navigation, Annotation, LinkAnnotation, BookmarkView,
            ThumbnailView, Print, TextSelection, TextSearch, FormFields, FormDesigner]} />
        </PdfViewerComponent>
      </div>
    </div>
  );
}
const root = ReactDOM.createRoot(document.getElementById('sample'));
root.render(<App />);