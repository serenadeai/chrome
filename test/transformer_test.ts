import { assert } from "chai";
import Transformer from "../src/editor/transformer";

// Make a contenteditable div in our global document
window.document.body.innerHTML = `
  <!DOCTYPE html>
  <div contenteditable="true" id="target"></div>
`;

// Select our contenteditable div
const target = window.document.getElementById("target")!;
const transformer = new Transformer(target);

const setEditorHTML = (content: string) => {
  target.innerHTML = content;
};

describe("getCursorPosition()", function () {
  // it("should return cursor position", function () {
  //   const first = window.document.getElementsByTagName("p")[0];
  //   let range = window.document.createRange();
  //   range.selectNodeContents(first);
  //   window.getSelection()!.removeAllRanges();
  //   window.getSelection()!.addRange(range);
  //
  //   assert.equal(transformer.getCursorPosition(), 0);
  // });
  // it("should return cursor position", function () {
  //   const second = window.document.getElementsByTagName("p")[1];
  //   assert.equal(second.childNodes.length, 1);
  //
  //   let range = window.document.createRange();
  //   range.setStart(second.firstChild!, 0);
  //   range.setEnd(second.firstChild!, 0);
  //   window.getSelection()!.removeAllRanges();
  //   window.getSelection()!.addRange(range);
  //
  //   assert.equal(transformer.getCursorPosition(), 11);
  // });
});

describe("getSource()", function () {
  it("source for simple case", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);
    assert.equal(transformer.getSource(), `abc`);
  });

  it("source for complex case", function () {
    setEditorHTML(
      `<p>a</p><div><p>b</p><br><p><span>e</span>c<span>d<i>f</i></span></p><span>h</span></div><p>g</p>`
    );
    assert.equal(
      transformer.getSource(),
      `a
b
ecdf
h
g
`
    );
  });
});

// describe("commands", function () {
//   it("delete range at cursor", function () {
//     // set innerHTML
//     // place cursor
//     // ask for source and cursor
//     // delete range command
//     // check new HTML, cursor
//   });
//
//   it("insert text at cursor", function () {
//     // set innerHTML
//     // place cursor
//     // ask for source and cursor
//     // insert text command
//     // check new HTML, cursor
//   });
//
//   it("replace range", function () {
//     // set innerHTML
//     // place cursor
//     // ask for source and cursor
//     // replace range command
//     // check new HTML, cursor
//   });
// });
