import { assert } from "chai";
import { JSDOM } from "jsdom";
import Transformer from "../src/editor/transformer";
import * as fs from "fs";
const t = fs.readFileSync("src/editor/transformer.ts", { encoding: "utf-8" });

const { window } = new JSDOM(
  `
<!DOCTYPE html>
<div contenteditable="true" id="target">
<p>a</p>
<p>b</p>
<p>c</p>
</div>
  `,
  { runScripts: "dangerously" }
);

const target = window.document.getElementById("target")!;
const transformer = new Transformer(target);

describe("getNodeInnerText()", function () {
  // it("should return innerText", function () {
  //   assert.equal(transformer.getNodeInnerText(), ``);
  // });

  it("should return cursor position", function () {
    const scriptEl = window.document.createElement("script");
    scriptEl.textContent = t;
    window.document.body.appendChild(scriptEl);

    console.log(
      window.eval(`
      const first = document.getElementsByTagName("p")[0];
      document.getSelection().collapse(first, 0);
      document.getSelection();
      const target = document.getElementById("target");
      const transformer = new Transformer(target);
    `)
    );
  });
});
