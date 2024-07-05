using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Syncfusion.EJ2.PdfViewer;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Reflection;
using System.Net;
using System.IO;
using Amazon;
using Amazon.S3;
using Amazon.S3.Model;

namespace PDFViewerSample.Pages
{
    [IgnoreAntiforgeryToken(Order = 1001)]
    public class IndexModel : PageModel
    {

        private readonly Microsoft.AspNetCore.Hosting.IHostingEnvironment _hostingEnvironment;
        private IMemoryCache _cache;
        private IConfiguration _configuration;
        public readonly string _accessKey;
        public readonly string _secretKey;
        public readonly string _bucketName;

        public IndexModel(Microsoft.AspNetCore.Hosting.IHostingEnvironment hostingEnvironment, IMemoryCache cache, IConfiguration configuration)
        {
            _hostingEnvironment = hostingEnvironment;
            _cache = cache;
            _configuration = configuration;
            _accessKey = _configuration.GetValue<string>("AccessKey");
            _secretKey = _configuration.GetValue<string>("SecretKey");
            _bucketName = _configuration.GetValue<string>("BucketName");
        }

        public async Task<IActionResult> OnPostLoadAsync([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            MemoryStream stream = new MemoryStream();
            var jsonObject = JsonConverterstring(responseData);
            object jsonResult = new object();
            if (jsonObject != null && jsonObject.ContainsKey("document"))
            {
                if (bool.Parse(jsonObject["isFileName"]))
                {
                    RegionEndpoint bucketRegion = RegionEndpoint.USEast1;

                    // Configure the AWS SDK with your access credentials and other settings
                    var s3Client = new AmazonS3Client(_accessKey, _secretKey, bucketRegion);

                    string document = jsonObject["document"];

                    // Specify the document name or retrieve it from a different source
                    var response = await s3Client.GetObjectAsync(_bucketName, document);

                    Stream responseStream = response.ResponseStream;
                    responseStream.CopyTo(stream);
                    stream.Seek(0, SeekOrigin.Begin);
                }
                else
                {
                    byte[] bytes = Convert.FromBase64String(jsonObject["document"]);
                    stream = new MemoryStream(bytes);
                }
            }
            jsonResult = pdfviewer.Load(stream, jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        public Dictionary<string, string> JsonConverterstring(jsonObjects results)
        {
            Dictionary<string, object> resultObjects = new Dictionary<string, object>();
            resultObjects = results.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public)
                .ToDictionary(prop => prop.Name, prop => prop.GetValue(results, null));
            var emptyObjects = (from kv in resultObjects
                                where kv.Value != null
                                select kv).ToDictionary(kv => kv.Key, kv => kv.Value);
            Dictionary<string, string> jsonResult = emptyObjects.ToDictionary(k => k.Key, k => k.Value.ToString());
            return jsonResult;
        }

        //Post action for processing the PDF documents.
        public IActionResult OnPostRenderPdfPages([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonObject = JsonConverterstring(responseData);
            object jsonResult = pdfviewer.GetPage(jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        //Post action for unloading and disposing the PDF document resources
        public IActionResult OnPostUnload([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonObject = JsonConverterstring(responseData);
            pdfviewer.ClearCache(jsonObject);
            return this.Content("Document cache is cleared");
        }

        //Post action for rendering the ThumbnailImages
        public IActionResult OnPostRenderThumbnailImages([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonObject = JsonConverterstring(responseData);
            object result = pdfviewer.GetThumbnailImages(jsonObject);
            return Content(JsonConvert.SerializeObject(result));
        }

        //Post action for processing the bookmarks from the PDF documents
        public IActionResult OnPostBookmarks([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonObject = JsonConverterstring(responseData);
            object jsonResult = pdfviewer.GetBookmarks(jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        //Post action for rendering the annotation comments
        public IActionResult OnPostRenderAnnotationComments([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonObject = JsonConverterstring(responseData);
            object jsonResult = pdfviewer.GetAnnotationComments(jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        //Post action for exporting the annotations
        public IActionResult OnPostExportAnnotations([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonObject = JsonConverterstring(responseData);
            string jsonResult = pdfviewer.ExportAnnotation(jsonObject);
            return Content(jsonResult);
        }

        //Post action for importing the annotations
        public IActionResult OnPostImportAnnotations([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonObject = JsonConverterstring(responseData);
            string jsonResult = string.Empty;
            object JsonResult;
            if (jsonObject != null && jsonObject.ContainsKey("fileName"))
            {
                string documentPath = GetDocumentPath(jsonObject["fileName"]);
                if (!string.IsNullOrEmpty(documentPath))
                {
                    jsonResult = System.IO.File.ReadAllText(documentPath);
                }
                else
                {
                    return this.Content(jsonObject["document"] + " is not found");
                }
            }
            else
            {
                string extension = Path.GetExtension(jsonObject["importedData"]);
                if (extension != ".xfdf")
                {
                    JsonResult = pdfviewer.ImportAnnotation(jsonObject);
                    return Content(JsonConvert.SerializeObject(JsonResult));
                }
                else
                {
                    string documentPath = GetDocumentPath(jsonObject["importedData"]);
                    if (!string.IsNullOrEmpty(documentPath))
                    {
                        byte[] bytes = System.IO.File.ReadAllBytes(documentPath);
                        jsonObject["importedData"] = Convert.ToBase64String(bytes);
                        JsonResult = pdfviewer.ImportAnnotation(jsonObject);
                        return Content(JsonConvert.SerializeObject(JsonResult));
                    }
                    else
                    {
                        return this.Content(jsonObject["document"] + " is not found");
                    }
                }
            }
            return Content(jsonResult);
        }

        //Post action for downloading the PDF documents
        public IActionResult OnPostDownload([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonObject = JsonConverterstring(responseData);
            string documentBase = pdfviewer.GetDocumentAsBase64(jsonObject);
            RegionEndpoint bucketRegion = RegionEndpoint.USEast1;

            // Configure the AWS SDK with your access credentials and other settings
            var s3Client = new AmazonS3Client(_accessKey, _secretKey, bucketRegion);
            string bucketName = _bucketName;
            string documentName = jsonObject["documentId"];
            string result = Path.GetFileNameWithoutExtension(documentName);
            byte[] bytes = Convert.FromBase64String(documentBase.Split(",")[1]);
            using (MemoryStream stream = new MemoryStream(bytes))
            {
                var request = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = result + "_downloaded.pdf",
                    InputStream = stream,
                };
                // Upload the PDF document to AWS S3
                var response = s3Client.PutObjectAsync(request).Result;
            }
            return Content(documentBase);
        }

        //Post action for printing the PDF documents
        public IActionResult OnPostPrintImages([FromBody] jsonObjects responseData)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonObject = JsonConverterstring(responseData);
            object pageImage = pdfviewer.GetPrintImage(jsonObject);
            return Content(JsonConvert.SerializeObject(pageImage));
        }

        //Gets the path of the PDF document
        private string GetDocumentPath(string document)
        {
            string documentPath = string.Empty;
            if (!System.IO.File.Exists(document))
            {
                string basePath = _hostingEnvironment.WebRootPath;
                string dataPath = string.Empty;
                dataPath = basePath + "/";
                if (System.IO.File.Exists(dataPath + (document)))
                    documentPath = dataPath + document;
            }
            else
            {
                documentPath = document;
            }
            return documentPath;
        }
    }

    public class jsonObjects
    {
        public string document { get; set; }
        public string password { get; set; }
        public string zoomFactor { get; set; }
        public string isFileName { get; set; }
        public string xCoordinate { get; set; }
        public string yCoordinate { get; set; }
        public string pageNumber { get; set; }
        public string documentId { get; set; }
        public string hashId { get; set; }
        public string sizeX { get; set; }
        public string sizeY { get; set; }
        public string startPage { get; set; }
        public string endPage { get; set; }
        public string stampAnnotations { get; set; }
        public string textMarkupAnnotations { get; set; }
        public string stickyNotesAnnotation { get; set; }
        public string shapeAnnotations { get; set; }
        public string measureShapeAnnotations { get; set; }
        public string action { get; set; }
        public string pageStartIndex { get; set; }
        public string pageEndIndex { get; set; }
        public string fileName { get; set; }
        public string elementId { get; set; }
        public string pdfAnnotation { get; set; }
        public string importPageList { get; set; }
        public string uniqueId { get; set; }
        public string data { get; set; }
        public string viewPortWidth { get; set; }
        public string viewPortHeight { get; set; }
        public string tilecount { get; set; }
        public bool isCompletePageSizeNotReceived { get; set; }
        public string freeTextAnnotation { get; set; }
        public string signatureData { get; set; }
        public string fieldsData { get; set; }
        public string FormDesigner { get; set; }
        public string inkSignatureData { get; set; }
        public bool hideEmptyDigitalSignatureFields { get; set; }
        public bool showDigitalSignatureAppearance { get; set; }
        public bool digitalSignaturePresent { get; set; }
        public string tileXCount { get; set; }
        public string tileYCount { get; set; }
        public string digitalSignaturePageList { get; set; }
        public string annotationCollection { get; set; }
        public string annotationsPageList { get; set; }
        public string formFieldsPageList { get; set; }
        public bool isAnnotationsExist { get; set; }
        public bool isFormFieldAnnotationsExist { get; set; }
        public string documentLiveCount { get; set; }
        public string annotationDataFormat { get; set; }
        public string importedData { get; set; }
    }
}