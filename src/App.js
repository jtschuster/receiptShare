import React from 'react';
import logo from './logo.svg';
import './App.css';
const { FormRecognizerClient, FormTrainingClient, AzureKeyCredential } = require("@azure/ai-form-recognizer");
const fs = require("fs");
const endpoint = "https://myreceiptrecognizer.cognitiveservices.azure.com/";
const apiKey = "c1af52ad6dcc4af08ba9d16d320b1480";
const {PDFDocument, rgb, mergeIntoTypedArray, rotateDegrees} = require('pdf-lib');


async function recognizeReceipt(formData) {
  // const originalPDF = await PDFDocument.load(formData);
  // page.drawSvgPath('M 0,20 L 100,160 Q 130,200 150,120 C 190,-40 200,200 300,150 L 400,90');
  const client = new FormRecognizerClient(endpoint, new AzureKeyCredential(apiKey));
  // const pollerUrl = await client.beginRecognizeReceiptsFromUrl(receiptUrl, {
  //   onProgress: (state) => { console.log(`status: ${state.status}`); }
  // });
  const poller = await client.beginRecognizeReceipts(formData, "application/pdf", {
    onProgress: (state) => { console.log(`status: ${state.status}`); }
  });

  const receipts = await poller.pollUntilDone();

  if (!receipts || receipts.length <= 0) {
    throw new Error("Expecting at lease one receipt in analysis result");
  }

  const receipt = receipts[0];
  console.log("First receipt:");
  const receiptTypeField = receipt.fields["ReceiptType"];
  if (receiptTypeField.valueType === "string") {
    console.log(`  Receipt Type: '${receiptTypeField.value || "<missing>"}', with confidence of ${receiptTypeField.confidence}`);
  }
  const merchantNameField = receipt.fields["MerchantName"];
  if (merchantNameField.valueType === "string") {
    console.log(`  Merchant Name: '${merchantNameField.value || "<missing>"}', with confidence of ${merchantNameField.confidence}`);
  }
  // const transactionDate = receipt.fields["TransactionDate"];
  // if (transactionDate.valueType === "date") {
  //   console.log(`  Transaction Date: '${transactionDate.value || "<missing>"}', with confidence of ${transactionDate.confidence}`);
  // }
  const itemsField = receipt.fields["Items"];
  if (itemsField.valueType === "array") {
    for (const itemField of itemsField.value || []) {
      if (itemField.valueType === "object") {
        const itemNameField = itemField.value["Name"];
        if (itemNameField.valueType === "string") {
          console.log(`    Item Name: '${itemNameField.value || "<missing>"}', with confidence of ${itemNameField.confidence}`);
        }
      }
    }
  }
  const totalField = receipt.fields["Total"];
  if (totalField.valueType === "number") {
    console.log(`  Total: '${totalField.value || "<missing>"}', with confidence of ${totalField.confidence}`);
  }
  return receipt;
}

// recognizeReceipt().catch((err) => {
//   console.error("The sample encountered an error:", err);
// });

async function drawBox(page, boundingBox) {
  let bb = boundingBox;
  let p1 = [boundingBox[0].x * 72, boundingBox[1] * 72];
  let p2 = [boundingBox[2] * 72, boundingBox[3] * 72];
  let p3 = [boundingBox[4] * 72, boundingBox[5] * 72];
  let p4 = [boundingBox[6] * 72, boundingBox[7] * 72];
  let x1 = bb[1].x - bb[0].x;
  let x2 = bb[2].x - bb[1].x;
  let x3 = bb[3].x - bb[2].x;
  let x4 = bb[0].x - bb[3].x;
  let y1 = bb[1].y - bb[0].y;
  let y2 = bb[2].y - bb[1].y;
  let y3 = bb[3].y - bb[2].y;
  let y4 = bb[0].y - bb[3].y;
  console.log(x1);
  console.log(x2);
  console.log(x3);
  console.log(x4);
  console.log(y1);
  console.log(y2);
  console.log(y3);
  console.log(y4);
  let svgpath = "m " + x1 + " " + y1 + " m " + x2 + " " + y2 + " m " + x3 + " " + y3 + " m " + x4 + " " + y4;
  page.drawSvgPath(svgpath, {x: parseFloat(x1), y: parseFloat(y1)});
}

class Person {
  name = "";
  bill = 0.0;
  color = "green";
}

class PersonButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected : false
    }
  }
  myOnClick() {
    console.log("clicked!");
    this.setState({selected : !this.state.selected})
  }
  render() {
    return (
      <button 
        onClick={() => this.myOnClick()} 
        style={{
          backgroundColor : this.state.selected ? this.props.person.color : "white",
          height : "5em",
          borderRadius : "50%",
          width : "5em",
          color : this.state.selected ? "white" : "black"
          }}>
          {this.props.person.name} <br></br>
          ${(Math.round(this.props.person.bill * 100) / 100).toFixed(2)}
      </button>
    )
  }
}

class UploadFileThing extends React.Component {
  constructor(props) {
    super(props);
    this.state = { receiptPdfUrl: "", receiptPdfUrl2: ""};
  }
  handleFileChange = async () => {
    console.log("dinging starting this function");
    let file = document.getElementById("myFile").files[0];
    let url = URL.createObjectURL(file)
    this.setState({receiptPdfUrl: url});
    console.log(url);
    const receipt = await recognizeReceipt(file);
    let pdf = await PDFDocument.load(await file.arrayBuffer());
    let page = pdf.getPage(0);
    const svgPath =
      'M 0,20 L 100,160 Q 130,200 150,120 C 190,-40 200,200 300,150 L 400,90';
    console.log(page.getHeight()+"   "+ page.getWidth());
    // const url22 = URL.createObjectURL(url2);
    let boundingBox = {};
    console.log( Object.keys(receipt.fields));
    const alltext = (receipt.fields)
    const itemsField = receipt.fields["Items"];
    if (itemsField.valueType === "array") {
      for (const itemField of itemsField.value || []) {
        if (itemField.valueType === "object") {
          console.log(Object.keys(itemsField));
          console.log(itemField);
          console.log(itemField.valueData);
          boundingBox = itemField.value.TotalPrice.valueData.boundingBox;
    //     }
    //   }
    // }
    // console.log(itemsField.value[0]);
    // boundingBox = itemsField.value[0].value.TotalPrice.valueData.boundingBox;
    console.log(itemsField);
    console.log(boundingBox);
    // drawBox(page, boundingBox);
    let bb = boundingBox;
    let x1 = Math.round(72 * (bb[1].x - bb[0].x));
    let x2 = Math.round(72 * (bb[2].x - bb[1].x));
    let x3 = Math.round(72 * (bb[3].x - bb[2].x));
    let x4 = Math.round(72 * (bb[0].x - bb[3].x));
    let y1 = Math.round(72 * (bb[1].y - bb[0].y));
    let y2 = Math.round(72 * (bb[2].y - bb[1].y));
    let y3 = Math.round(72 * (bb[3].y - bb[2].y));
    let y4 = Math.round(72 * (bb[0].y - bb[3].y));
    console.log(x1);
    console.log(x2);
    console.log(x3);
    console.log(x4);
    console.log(y1);
    console.log(y2);
    console.log(y3);
    console.log(y4);
    let svgpath = " l " + x1 + " " + y1 + " l " + x2 + " " + y2 + " l " + x3 + " " + y3 + " l " + x4 + " " + y4;
    console.log(svgpath);
    // page.drawRectangle({x:2,y:0,width:200, height:500, borderWidth: 10, color:rgb(0,1,0)});
    page.drawSvgPath(svgpath, { x : parseFloat(bb[0].x * 72), 
                                y : page.getHeight() - (parseFloat(bb[0].y * 72)),
                                borderWidth: 1,
                                borderColor: rgb(0,0,1),
                                scale: 1,
                                rotateDegrees: 0
                              });
                            }}}
    // page.drawSvgPath(svgPath, {scale: 0.1, x:20, y:20 });
    let url2 = await pdf.saveAsBase64({ dataUri: true }); // receiptPdfUrl: ""
    this.setState({ receiptPdfUrl2: url2 });
  }
  render() {
    return (
      <div>
        <input id="myFile" type="file" onChange={this.handleFileChange}></input>
        <iframe src={this.state.receiptPdfUrl} height="1000px"></iframe>
        <iframe src={this.state.receiptPdfUrl2} height="1000px"></iframe>
      </div>
      );
  }
}
function App() {  

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and asd to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn asdfad
        </a>
      </header>
      <PersonButton person={{name : "Jackson", color: "green", bill : 1}}></PersonButton>
      <PersonButton person={{ name: "Jenni", color: "blue", bill: 4 }}></PersonButton>
      <UploadFileThing></UploadFileThing>
    </div>
  );
}

export default App;



// console.log("First receipt:");
// const receiptTypeField = receipt.fields["ReceiptType"];
// if (receiptTypeField.valueType === "string") {
//   console.log(`  Receipt Type: '${receiptTypeField.value || "<missing>"}', with confidence of ${receiptTypeField.confidence}`);
// }
// const merchantNameField = receipt.fields["MerchantName"];
// if (merchantNameField.valueType === "string") {
//   console.log(`  Merchant Name: '${merchantNameField.value || "<missing>"}', with confidence of ${merchantNameField.confidence}`);
// }
// // const transactionDate = receipt.fields["TransactionDate"];
// // if (transactionDate.valueType === "date") {
// //   console.log(`  Transaction Date: '${transactionDate.value || "<missing>"}', with confidence of ${transactionDate.confidence}`);
// // }
// const itemsField = receipt.fields["Items"];
// if (itemsField.valueType === "array") {
//   for (const itemField of itemsField.value || []) {
//     if (itemField.valueType === "object") {
//       const itemNameField = itemField.value["Name"];
//       if (itemNameField.valueType === "string") {
//         console.log(`    Item Name: '${itemNameField.value || "<missing>"}', with confidence of ${itemNameField.confidence}`);
//       }
//     }
//   }
// }
// const totalField = receipt.fields["Total"];
// if (totalField.valueType === "number") {
//   console.log(`  Total: '${totalField.value || "<missing>"}', with confidence of ${totalField.confidence}`);
// }