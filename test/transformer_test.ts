import sinon from "sinon";
import { assert } from "chai";
import Transformer from "../src/editor/transformer";
import IPC from "../src/shared/ipc";

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

describe("_setCursor()", function () {
  it("simple case", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);

    const first = window.document.getElementsByTagName("span")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(2);

    const second = window.document.getElementsByTagName("span")[1];
    // The selection should be on the second span's Text element
    const text = second.childNodes.item(0);

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, text);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 1);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, text);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 1);
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
    window.getSelection()!.collapse(d, 0);

    Transformer.setCursor(11);

    const bold = window.document.getElementsByTagName("b")[0];
    // The selection should be on the bold element's Text element
    const text = bold.childNodes.item(0);

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, text);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 1);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, text);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 1);
  });
});

describe("getCursor()", function () {
  it("simple case", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);

    const second = window.document.getElementsByTagName("span")[1];
    window.getSelection()!.collapse(second, 0);

    assert.equal(Transformer.getCursor(), 1);
  });

  it("space case", function () {
    setEditorHTML(`<span>a&nbsp;&nbsp;</span><span>b</span><span>c</span>`);

    const second = window.document.getElementsByTagName("span")[1];
    window.getSelection()!.collapse(second, 0);

    assert.equal(Transformer.getCursor(), 3);
  });

  it("offset case", function () {
    setEditorHTML(`<span>a</span><span>bananas</span><span>c</span>`);

    const second = window.document.getElementsByTagName("span")[1];
    window.getSelection()!.collapse(second.childNodes.item(0), 2);

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
    window.getSelection()!.collapse(d, 0);

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

describe("deleteRange", function () {
  it("space case", function () {
    // set innerHTML
    setEditorHTML(`<p>a&nbsp;&nbsp;c</p><span>b</span>`);

    // place cursor after b, cursor 5
    const second = window.document.getElementsByTagName("span")[0];
    window.getSelection()!.collapse(second.childNodes.item(0), 1);

    const ipc = {
      send: (message: string, data: any) => {
        return { message, data };
      },
    };

    const mock = sinon.mock(ipc);
    mock.expects("send").once().withArgs("simulateDelete", { deleteCount: 2 });

    // call deleteRange
    Transformer.deleteRange((ipc as unknown) as IPC, 3, 5);

    mock.verify();
  });
});

describe("insertText", function () {
  it("space case", function () {
    // set innerHTML
    setEditorHTML(`<p>a&nbsp;&nbsp;c</p><span>b</span>`);

    // place cursor after b, cursor 5
    const second = window.document.getElementsByTagName("span")[0];
    window.getSelection()!.collapse(second.childNodes.item(0), 1);

    const ipc = {
      send: (message: string, data: any) => {
        return { message, data };
      },
    };

    const spy = sinon.spy(Transformer, "setCursor");
    const mock = sinon.mock(ipc);
    mock.expects("send").once().withArgs("insertText", { text: "efg" });

    // call insertText
    Transformer.insertText((ipc as unknown) as IPC, 5, "efg");

    mock.verify();
    assert(spy.calledOnceWithExactly(5));
  });
});
