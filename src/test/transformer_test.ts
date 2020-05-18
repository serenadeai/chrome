import sinon from "sinon";
import { assert } from "chai";
import Transformer from "../content/transformer";
import IPC from "../shared/ipc";

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

describe("setCursor()", function () {
  it("abc", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);

    const first = window.document.getElementsByTagName("span")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(2);

    const c = window.document.getElementsByTagName("span")[2];
    // The selection should be on the second span's Text element
    const text = c.childNodes.item(0);

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, text);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, text);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 0);
  });

  it("abc with end", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);

    const first = window.document.getElementsByTagName("span")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(0, 3);

    const a = window.document.getElementsByTagName("span")[0];
    const aText = a.childNodes.item(0);
    const c = window.document.getElementsByTagName("span")[2];
    const cText = c.childNodes.item(0);

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, aText);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, cText);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 1);
  });

  it("abc with line break", function () {
    setEditorHTML(`<span>a</span><span>b</span><br><span>c</span>`);

    const first = window.document.getElementsByTagName("span")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(0, 3);

    const a = window.document.getElementsByTagName("span")[0];
    const aText = a.childNodes.item(0);
    const br = window.document.getElementsByTagName("br")[0];

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, aText);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    // assert.equal(window.getSelection()!.getRangeAt(0).endContainer, br);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 0);
  });

  it("abc with line break at start", function () {
    setEditorHTML(`<span>a</span><span>b</span><br><p>c</p>`);

    const first = window.document.getElementsByTagName("span")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(3, 4);

    const c = window.document.getElementsByTagName("p")[0];
    const cText = c.childNodes.item(0);

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, cText);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, cText);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 1);
  });

  it("multiple line breaks", function () {
    setEditorHTML(`one<br><div><br></div><div>two</div>`);

    const first = window.document.getElementsByTagName("div")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(4);

    const br = window.document.getElementsByTagName("br")[1];

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, br);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, br);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 0);
  });

  it("multiple consecutive line breaks", function () {
    setEditorHTML(`one<br><br><br><div><br></div><div>two</div>`);

    const first = window.document.getElementsByTagName("div")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(4);

    const br = window.document.getElementsByTagName("br")[1];

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, br);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, br);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 0);
  });

  it("two with line break", function () {
    setEditorHTML(`one<br><div><br></div><div>two</div>`);

    const first = window.document.getElementsByTagName("div")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(6);

    const div = window.document.getElementsByTagName("div")[2].childNodes.item(0);

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, div);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 1);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, div);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 1);
  });

  it("two with line break", function () {
    setEditorHTML(`one<br><div><br></div><div>two</div>`);

    const first = window.document.getElementsByTagName("div")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(5, 8);

    const div = window.document.getElementsByTagName("div")[2].childNodes.item(0);

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, div);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, div);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 3);
  });

  it("five with line break", function () {
    setEditorHTML(`one<br><div>two</div><div>three</div><div>four</div><div>five</div>`);

    const first = window.document.getElementsByTagName("div")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(8, 13);

    const div = window.document.getElementsByTagName("div")[2].childNodes.item(0);

    // assert.equal(window.getSelection()!.getRangeAt(0).startContainer, div);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    // assert.equal(window.getSelection()!.getRangeAt(0).endContainer, div);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 5);
  });

  it("select line break", function () {
    setEditorHTML(`one<div><br><div>two</div><div>three</div><div>four</div><div>five</div></div>`);

    const first = window.document.getElementsByTagName("div")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(4, 4);

    const br = window.document.getElementsByTagName("br")[0];

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, br);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, br);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 0);
  });

  it("select up to line break", function () {
    setEditorHTML(`one<div><br><div>two</div><div>three</div><div>four</div><div>five</div></div>`);

    const first = window.document.getElementsByTagName("div")[0];
    let range = window.document.createRange();
    range.selectNodeContents(first);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    Transformer.setCursor(0, 4);

    const br = window.document.getElementsByTagName("br")[0];

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, first.childNodes.item(0));
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, br);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 0);
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

    Transformer.setCursor(10);

    const bold = window.document.getElementsByTagName("b")[0];
    // The selection should be on the bold element's Text element
    const text = bold.childNodes.item(0);

    // assert.equal(window.getSelection()!.getRangeAt(0).startContainer, text);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    // assert.equal(window.getSelection()!.getRangeAt(0).endContainer, text);
    assert.equal(window.getSelection()!.getRangeAt(0).endOffset, 0);
  });

  it("complex case with end", function () {
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

    Transformer.setCursor(10, 12);

    const bold = window.document.getElementsByTagName("b")[0];
    // the selection should start on the bold element's Text element
    const boldText = bold.childNodes.item(0);

    const span = window.document.getElementsByTagName("span")[1];
    // and end on the span element's Text element
    const spanText = span.childNodes.item(0);

    assert.equal(window.getSelection()!.getRangeAt(0).startContainer, boldText);
    assert.equal(window.getSelection()!.getRangeAt(0).startOffset, 0);
    assert.equal(window.getSelection()!.getRangeAt(0).endContainer, spanText);
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
      ab| <= 2
      cde| <= 6
      f| <= 8
      ghi| <= 12
     */
    setEditorHTML(
      `<div><span>a</span>b<p>c<i>d</i>e</p></div><div>f<p>g<b>h</b><span>i</span></p></div>`
    );

    const i = window.document.getElementsByTagName("span")[1];
    window.getSelection()!.collapse(i, 0);

    assert.equal(Transformer.getCursor(), 11);
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

  it("newline br br", function () {
    setEditorHTML(`a<br><br><span>b</span>`);
    assert.equal(
      Transformer.getSource(target),
      `a

b`
    );
  });

  it("newline br p", function () {
    setEditorHTML(`a<br><p>b</p>`);
    assert.equal(
      Transformer.getSource(target),
      `a
b`
    );
  });

  it("newline br div br", function () {
    setEditorHTML(`a<br><div><br></div><span>b</span>`);
    assert.equal(
      Transformer.getSource(target),
      `a

b`
    );
  });

  it("newline p span", function () {
    setEditorHTML(`<p>a</p><span>b</span>`);
    assert.equal(
      Transformer.getSource(target),
      `a
b`
    );
  });

  it("newline span p", function () {
    setEditorHTML(`<span>a</span><p>b</p>`);
    assert.equal(
      Transformer.getSource(target),
      `a
b`
    );
  });

  it("newline span p span", function () {
    setEditorHTML(`<span>a</span><p>b</p><span>c</span>`);
    assert.equal(
      Transformer.getSource(target),
      `a
b
c`
    );
  });

  it("multiple line breaks", function () {
    setEditorHTML(`one<br><div><br></div><div>two</div>`);
    assert.equal(
      Transformer.getSource(target),
      `one

two`
    );
  });

  it("complex cursor case", function () {
    setEditorHTML(
      `<div><span>a</span>b<p>c<i>d</i>e</p></div><div>f<p>g<b>h</b><span>i</span></p></div>`
    );

    assert.equal(
      Transformer.getSource(target),
      `ab
cde
f
ghi`
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
g`
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

  after(function () {
    (Transformer.setCursor as any).restore();
  });
});
