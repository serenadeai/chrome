import { assert } from "chai";
import Transformer from "../src/editor/transformer";

// Make a contenteditable div in our global document
window.document.body.innerHTML = `
  <!DOCTYPE html>
  <div contenteditable="true"></div>
`;

// Select our div so we can set the content
const target = window.document.getElementsByTagName("div")[0]!;
const setEditorHTML = (content: string) => {
  target.innerHTML = content;
};

describe("getCursorPosition()", function () {
  it("simple case", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);

    const second = window.document.getElementsByTagName("span")[1];
    let range = window.document.createRange();
    range.selectNodeContents(second);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    assert.equal(Transformer.getCursor(), 1);
  });

  it("complex case", function () {
    /*
      ab
      cde
      f
      ghi
     */
    setEditorHTML(
      `<div><span>a</span>b<p>c<span>d</span>e</p></div><div>f<p>g<span>h</span><span>i</span></p></div>`
    );

    const d = window.document.getElementsByTagName("span")[1];
    let range = window.document.createRange();
    range.selectNodeContents(d);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    assert.equal(Transformer.getCursor(), 4);
  });
});

describe("getSource()", function () {
  it("simple case", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);
    assert.equal(Transformer.getSource(target), `abc`);
  });

  it("newline case before", function () {
    setEditorHTML(`<p>a</p><span>b</span>`);
    assert.equal(
      Transformer.getSource(target),
      `a
b`
    );
  });

  it("newline case after", function () {
    setEditorHTML(`<span>a</span><p>b</p>`);
    assert.equal(
      Transformer.getSource(target),
      `a
b`
    );
  });

  it("newline case between", function () {
    setEditorHTML(`<span>a</span><p>b</p><span>c</span>`);
    assert.equal(
      Transformer.getSource(target),
      `a
b
c`
    );
  });

  it("complex case", function () {
    setEditorHTML(
      `<p>a</p><div><p>b</p><br><p><span>e</span>c<span>d<i>f</i></span></p><span>h</span></div><p>g</p>`
    );
    assert.equal(
      Transformer.getSource(target),
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
