import { assert } from "chai";
import Transformer from "../content/transformer";

// Make a contenteditable div in our global document
window.document.body.innerHTML = `
  <!DOCTYPE html>
  <div contenteditable="true"></div>
`;

// Select our div so we can set the content
const target = window.document.getElementsByTagName("div")[0]!;
const setEditorHTML = (content: string) => {
  target.innerHTML = content;
  selectTarget();
};

const selectTarget = () => {
  if (window.getSelection()!.rangeCount) {
    window.getSelection()!.empty();
  }
  window.getSelection()!.collapse(target, 0);
};

const selectElement = (tagName: string, index: number) => {
  return window.document.getElementsByTagName(tagName)[index];
};

const selectTextElement = (tagName: string, index: number) => {
  return selectElement(tagName, index).childNodes.item(0);
};

const assertRange = (
  _startContainer: Node,
  startOffset: number,
  _endContainer: Node,
  endOffset: number
) => {
  // console.log(
  //   window.getSelection()!.getRangeAt(0).startContainer.nodeType,
  //   window.getSelection()!.getRangeAt(0).startContainer.textContent,
  //   window.getSelection()!.getRangeAt(0).endContainer.nodeType,
  //   window.getSelection()!.getRangeAt(0).endContainer.textContent
  // );
  assert.equal(window.getSelection()!.getRangeAt(0).startContainer, _startContainer);
  assert.equal(window.getSelection()!.getRangeAt(0).startOffset, startOffset);
  assert.equal(window.getSelection()!.getRangeAt(0).endContainer, _endContainer);
  assert.equal(window.getSelection()!.getRangeAt(0).endOffset, endOffset);
};

describe("setCursor()", function () {
  it("abc", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);
    Transformer.setCursor(2);

    const b = selectTextElement("span", 1);
    assertRange(b, 1, b, 1);
  });

  it("abc at end", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);
    Transformer.setCursor(3);

    const c = selectTextElement("span", 2);
    assertRange(c, 1, c, 1);
  });

  it("abc to end", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);
    Transformer.setCursor(0, 3);

    const a = selectTextElement("span", 0);
    const c = selectTextElement("span", 2);
    assertRange(a, 0, c, 1);
  });

  it("abc past end", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);
    Transformer.setCursor(0, 4);

    const a = selectTextElement("span", 0);
    const c = selectTextElement("span", 2);
    assertRange(a, 0, c, 1);
  });

  it("abc with line break", function () {
    setEditorHTML(`<span>a</span><span>b</span><br><span>c</span>`);
    Transformer.setCursor(0, 3);

    const a = selectTextElement("span", 0);
    const c = selectTextElement("span", 2);
    assertRange(a, 0, c, 0);
  });

  it("abc with line break at start", function () {
    setEditorHTML(`<span>a</span><span>b</span><br><p>c</p>`);
    Transformer.setCursor(3, 4);

    const c = selectTextElement("p", 0);
    assertRange(c, 0, c, 1);
  });

  it("multiple line breaks", function () {
    setEditorHTML(`one<br><div><br></div><div>two</div>`);
    Transformer.setCursor(4);

    const br = selectElement("br", 1);
    assertRange(br, 0, br, 0);
  });

  it("multiple line breaks by block element", function () {
    setEditorHTML(`<div>one</div><div><br></div><div>two</div>`);
    Transformer.setCursor(3);

    const div = selectTextElement("div", 1);
    assertRange(div, 3, div, 3);
  });

  it("multiple consecutive line breaks", function () {
    setEditorHTML(`one<br><br><br><div><br></div><div>two</div>`);
    Transformer.setCursor(4);

    const br = selectElement("br", 1);
    assertRange(br, 0, br, 0);
  });

  it("two with line break", function () {
    setEditorHTML(`one<br><div><br></div><div>two</div>`);
    Transformer.setCursor(6);

    const two = selectTextElement("div", 2);
    assertRange(two, 1, two, 1);
  });

  it("two after line break", function () {
    setEditorHTML(`one<br><div><br></div><div>two</div>`);
    Transformer.setCursor(5, 8);

    const two = selectTextElement("div", 2);
    assertRange(two, 0, two, 3);
  });

  it("two including line break", function () {
    setEditorHTML(`one<br><div><br></div><div>two</div>`);
    Transformer.setCursor(4, 8);

    const br = selectElement("br", 1);
    const two = selectTextElement("div", 2);
    assertRange(br, 0, two, 3);
  });

  it("three with line break", function () {
    setEditorHTML(`one<br><div>two</div><div>three</div><div>four</div><div>five</div>`);
    Transformer.setCursor(8, 13);

    const three = selectTextElement("div", 2);
    assertRange(three, 0, three, 5);
  });

  it("select line break", function () {
    setEditorHTML(`one<div><br><div>two</div><div>three</div><div>four</div><div>five</div></div>`);
    Transformer.setCursor(4, 4);

    const br = selectElement("br", 0);
    assertRange(br, 0, br, 0);
  });

  it("select up to line break", function () {
    setEditorHTML(`one<div><br><div>two</div><div>three</div><div>four</div><div>five</div></div>`);
    Transformer.setCursor(0, 4);

    const one = selectTextElement("div", 0);
    const br = selectElement("br", 0);
    assertRange(one, 0, br, 0);
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
    Transformer.setCursor(11);

    // The selection should be on the bold element's Text element
    const bold = selectTextElement("b", 0);
    assertRange(bold, 1, bold, 1);
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
    Transformer.setCursor(10, 12);

    const bold = selectTextElement("b", 0);
    const i = selectTextElement("span", 1);
    assertRange(bold, 0, i, 1);
  });
});

describe("getCursor()", function () {
  it("simple case", function () {
    setEditorHTML(`<span>a</span><span>b</span><span>c</span>`);

    const b = selectTextElement("span", 1);
    window.getSelection()!.collapse(b, 0);

    assert.equal(Transformer.getCursor(), 1);
  });

  it("space case", function () {
    setEditorHTML(`<span>a&nbsp;&nbsp;</span><span>b</span><span>c</span>`);

    const b = selectTextElement("span", 1);
    window.getSelection()!.collapse(b, 0);

    assert.equal(Transformer.getCursor(), 3);
  });

  it("offset case", function () {
    setEditorHTML(`<span>a</span><span>bananas</span><span>c</span>`);

    const b = selectTextElement("span", 1);
    window.getSelection()!.collapse(b, 2);

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

    const d = selectTextElement("span", 1);
    window.getSelection()!.collapse(d, 0);

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
