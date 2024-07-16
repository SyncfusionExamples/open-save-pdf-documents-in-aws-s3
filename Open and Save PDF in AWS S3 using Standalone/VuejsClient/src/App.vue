<template>
  <ejs-pdfviewer 
    id="pdfViewer" 
    :resourceUrl="resourceUrl" 
    :toolbarClick="toolbarClick" 
    :created="loadPdfDocument" 
    :toolbarSettings="toolbarSettings">
  </ejs-pdfviewer>
</template>

<script>
import { PdfViewerComponent, Toolbar, Magnification, Navigation, LinkAnnotation, BookmarkView, 
           ThumbnailView, Print, TextSelection, TextSearch, Annotation, FormDesigner, FormFields, PageOrganizer } from '@syncfusion/ej2-vue-pdfviewer';
import AWS from 'aws-sdk';

  AWS.config.update({
    region: 'update this your region',
    accessKeyId: 'Update this with your access key id', 
    secretAccessKey: 'Update this with your secret access key',
  });

  export default {
    name: 'App',

    components: {
      "ejs-pdfviewer": PdfViewerComponent
    },

    data() {
      let toolItem1 = {
        prefixIcon: 'e-icons e-pv-download-document-icon',
        id: 'download_pdf',
        tooltipText: 'Download file',
        align: 'right'
      };

      return {
        resourceUrl: 'https://cdn.syncfusion.com/ej2/23.1.43/dist/ej2-pdfviewer-lib',
        toolbarSettings: {
          toolbarItems: [ 'OpenOption', 'PageNavigationTool', 'MagnificationTool', 'PanTool', 'SelectionTool', 'SearchOption', 'PrintOption', toolItem1, 'UndoRedoTool', 'AnnotationEditTool', 'FormDesignerEditTool', 'CommentTool', 'SubmitForm']
        },
      };
    },

    methods: {
      toolbarClick: function (args) {
          if (args.item && args.item.id === 'download_pdf') {
            this.savePdfDocument();
          }
      },

      loadPdfDocument: function () {
        const getObjectParams = {
          Bucket: 'Update this with your bucket name',
          Key: 'Update this with your key name',
        };
        var s3= new AWS.S3();
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
                var viewer = document.getElementById('pdfViewer').ej2_instances[0];
                viewer.load("data:application/pdf;base64,"+base64String);
              }, 2000);
            }
          }
        });
      },

      savePdfDocument: function () {
        var viewer = document.getElementById('pdfViewer').ej2_instances[0];
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
            var s3= new AWS.S3();
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
    },

    provide: {
      PdfViewer: [ Toolbar, Magnification, Navigation, LinkAnnotation, BookmarkView, ThumbnailView,
                   Print, TextSelection, TextSearch, Annotation, FormDesigner, FormFields, PageOrganizer ]
    }
  }
</script>

<style>
  @import '../node_modules/@syncfusion/ej2-base/styles/material.css';
  @import '../node_modules/@syncfusion/ej2-buttons/styles/material.css';
  @import '../node_modules/@syncfusion/ej2-dropdowns/styles/material.css';  
  @import '../node_modules/@syncfusion/ej2-inputs/styles/material.css';  
  @import '../node_modules/@syncfusion/ej2-navigations/styles/material.css';
  @import '../node_modules/@syncfusion/ej2-popups/styles/material.css';
  @import '../node_modules/@syncfusion/ej2-splitbuttons/styles/material.css';
  @import '../node_modules/@syncfusion/ej2-lists/styles/material.css';
  @import '../node_modules/@syncfusion/ej2-vue-pdfviewer/styles/material.css';
</style>