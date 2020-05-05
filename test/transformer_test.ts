import { assert } from "chai";
import Transformer from "../src/editor/transformer";

window.document.body.innerHTML = `
  <!DOCTYPE html>
    <div contenteditable="true" id="target"><p>a</p><p>b</p><p>c</p></div>
`;

const target = window.document.getElementById("target")!;
const transformer = new Transformer(target);

describe("getNodeInnerText()", function () {
  // it("should return innerText", function () {
  //   assert.equal(transformer.getNodeInnerText(), ``);
  // });

  // it("should return cursor position", function () {
  //   const first = window.document.getElementsByTagName("p")[0];
  //   let range = window.document.createRange();
  //   range.selectNodeContents(first);
  //   window.getSelection()!.removeAllRanges();
  //   window.getSelection()!.addRange(range);
  //
  //   assert.equal(transformer.getCursorPosition(), 0);
  // });

  it("should return cursor position", function () {
    const second = window.document.getElementsByTagName("p")[1];
    assert.equal(second.childNodes.length, 1);

    let range = window.document.createRange();
    range.setStart(second.firstChild!, 0);
    range.setEnd(second.firstChild!, 0);
    window.getSelection()!.removeAllRanges();
    window.getSelection()!.addRange(range);

    assert.equal(transformer.getCursorPosition(), 11);
  });
});
