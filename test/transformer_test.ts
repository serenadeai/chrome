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

describe("getCursor()", function () {
  it("simple case", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);

    const second = window.document.getElementsByTagName("span")[1];
    let range = window.document.createRange();
    range.selectNodeContents(second);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    assert.equal(Transformer.getCursor(), 1);
  });

  it("space case", function () {
    setEditorHTML(`<span>a&nbsp;&nbsp;</span><span>b</span><span>c</span>`);

    const second = window.document.getElementsByTagName("span")[1];
    let range = window.document.createRange();
    range.selectNodeContents(second);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    assert.equal(Transformer.getCursor(), 3);
  });

  it("offset case", function () {
    setEditorHTML(`<span>a</span><span>bananas</span><span>c</span>`);

    const second = window.document.getElementsByTagName("span")[1];
    let range = window.document.createRange();
    range.setStart(second.childNodes.item(0), 2); // after the first a
    range.setEnd(second.childNodes.item(0), 2);
    range.collapse();
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    assert.equal(Transformer.getCursor(), 3);
  });

  it("complex case", function () {
    /*
      ab
      cde
      f
      ghi
     */
    setEditorHTML(
      `<div><span>a</span>b<p>c<i>d</i>e</p></div><div>f<p>g<b>h</b><span>i</span></p></div>`
    );

    const d = window.document.getElementsByTagName("span")[1];
    let range = window.document.createRange();
    range.selectNodeContents(d);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    assert.equal(Transformer.getCursor(), 12);
  });
});

describe("getSource()", function () {
  it("simple case", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);
    assert.equal(Transformer.getSource(target), `abc`);
  });

  it("space case", function () {
    setEditorHTML(`<p>a&nbsp;&nbsp;c</p><span>b</span>`);
    // The non-breaking space is Unicode 160, not a typed space, which is 32.
    assert.equal(
      Transformer.getSource(target),
      `a${String.fromCodePoint(160)}${String.fromCodePoint(160)}c
b`
    );
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
b
`
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
      `<p>a</p><div><div><p>b</p><p>c</p></div><br><p><span>e</span>c<span>d<i>f</i></span></p><span>h</span></div><p>g</p>`
    );
    assert.equal(
      Transformer.getSource(target),
      `a
b
c

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
