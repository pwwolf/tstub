import {
  SchemaObject,
  ReferenceObject,
  OpenApiSpec
} from "@loopback/openapi-v3-types";
import * as ts from "typescript";
import { generateTypeNode } from "./models";
import { createRegisterHandlersFunction } from "./handlers";

const resultFile = ts.createSourceFile(
  "api.ts",
  "",
  ts.ScriptTarget.Latest,
  /*setParentNodes*/ false,
  ts.ScriptKind.TS
);
const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed
});

function printNode(node: ts.Node) {
  const result = printer.printNode(ts.EmitHint.Unspecified, node, resultFile);
  console.log(result);
}

export function generateApi(spec: OpenApiSpec, deref: OpenApiSpec) {
  //create imports
  let imports = ts.createImportDeclaration(
    undefined,
    undefined,
    ts.createImportClause(
      undefined,
      ts.createNamedImports([
        ts.createImportSpecifier(undefined, ts.createIdentifier("wireHandler"))
      ])
    ),
    //ts.createImportSpecifier(ts.createIdentifier("wireHandler"))
    ts.createStringLiteral("tswag")
  );

  let modelsDeclarations = [];
  //generate namespace
  if (spec.components && spec.components.schemas) {
    for (let typeName of Object.keys(spec.components.schemas)) {
      let schema = spec.components.schemas[typeName];
      let type = generateTypeNode(schema);

      //Creates type Pet =  {....}
      let declaration = ts.createTypeAliasDeclaration(
        undefined,
        [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
        typeName,
        undefined,
        type
      );
      modelsDeclarations.push(declaration);
    }
  }

  const regHandlersFunc = createRegisterHandlersFunction(spec, deref);

  const namespace = spec.info.title.replace(/ /g, "");

  let module = ts.createModuleDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.createIdentifier(namespace),
    ts.createModuleBlock([...modelsDeclarations, regHandlersFunc]),
    undefined
  );
  printNode(imports);
  printNode(module);
}