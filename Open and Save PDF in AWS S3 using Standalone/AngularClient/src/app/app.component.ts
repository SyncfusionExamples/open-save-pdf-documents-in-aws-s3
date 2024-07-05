import { Component, OnInit } from '@angular/core';
import { LinkAnnotationService, BookmarkViewService,
         MagnificationService, ThumbnailViewService, ToolbarService,
         NavigationService, TextSearchService, TextSelectionService,
         PrintService, FormDesignerService, FormFieldsService, 
         AnnotationService, PageOrganizerService, PdfViewerComponent, CustomToolbarItemModel } from '@syncfusion/ej2-angular-pdfviewer';
import * as AWS from 'aws-sdk';

AWS.config.update({
  region: 'pdate this your region',
  accessKeyId: 'Update this with your access key id', 
  secretAccessKey: 'Update this with your secret access key',
});

@Component({
  selector: 'app-root',
  // specifies the template string for the PDF Viewer component
  template: `<div class="content-wrapper">
                <ejs-pdfviewer id="pdfViewer"
                    [resourceUrl]='resource' 
                    [toolbarSettings]="toolbarSettings"
                    (toolbarClick)="toolbarClick($event)"
                    (created)='loadDocument()'
                    style="height:640px;display:block">
                </ejs-pdfviewer>
             </div>`,
  providers: [ LinkAnnotationService, BookmarkViewService, MagnificationService,
               ThumbnailViewService, ToolbarService, NavigationService,
               TextSearchService, TextSelectionService, PrintService,
               AnnotationService, FormDesignerService, FormFieldsService, PageOrganizerService]
})
export class AppComponent implements OnInit {
  public resource: string = "https://cdn.syncfusion.com/ej2/23.1.43/dist/ej2-pdfviewer-lib";

  ngOnInit(): void {
  }

  public toolItem1: CustomToolbarItemModel = {
    prefixIcon: 'e-icons e-pv-download-document-icon',
    id: 'download_pdf',
    tooltipText: 'Download file',
    align: 'right'
  };

  public toolbarSettings = {
    showTooltip: true,
    toolbarItems: ['OpenOption', 'PageNavigationTool', 'MagnificationTool', 'PanTool', 'SelectionTool', 'SearchOption', 'PrintOption', this.toolItem1, 'UndoRedoTool', 'AnnotationEditTool', 'FormDesignerEditTool', 'CommentTool', 'SubmitForm']
  };

  public toolbarClick(args: any): void {
    if (args.item && args.item.id === 'download_pdf') {
      this.saveDocument();
    }
  }

  private s3 = new AWS.S3();

  loadDocument() {
    const getObjectParams = {
      Bucket: 'Update this with your bucket name',
      Key: 'Update this with your key name',
    };
    this.s3.getObject(getObjectParams, (err, data) => {
      if (err) {
        console.error('Error fetching document:', err);
      } else {
        if (data && data.Body) {
          const bytes = new Uint8Array(data.Body as ArrayBuffer);
          let binary = '';
          bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
          const base64String = window.btoa(binary);
          console.log('Document data as Base64:', base64String);
          var viewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];  
          setTimeout(() => {
            viewer.load("data:application/pdf;base64,"+base64String);
          }, 2000);
        }
      }
    });
  }

  saveDocument() {
    var viewer = (<any>document.getElementById("pdfViewer")).ej2_instances[0];  
    viewer.saveAsBlob().then((value: Blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
        const putObjectParams = {
          Bucket: 'Update this with your bucket name',
          Key: 'Update this with your key name',
          Body: uint8Array,
          ContentType: 'application/pdf',
        };
        this.s3.putObject(putObjectParams, (err, data) => {
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
}