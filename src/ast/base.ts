import { Token } from 'antlr4ts/Token'
import * as vscode from 'vscode'
import {
  CompletionItemKind,
  Definition,
  DefinitionLink,
  Location,
  Position,
  ProviderResult,
  SymbolKind,
  TextDocument,
  WorkspaceEdit,
} from 'vscode'
import { Identifier, IdentifierKind } from './identifier'
import { Ast } from './ast'

export class Base extends Ast implements VscodeInterface {
  members: Map<string, Identifier>

  constructor(name: string, token: Token) {
    super(name, token)
    this.members = new Map()
    this.kind = IdentifierKind.Type
  }

  getChild(): Identifier[] {
    return Array.from(this.members.values())
  }

  // override
  findOne(identifier: Identifier): Identifier | undefined {
    if (this.contains(identifier)) {
      if (this.name === identifier.name) return this
      const member = this.members.get(<string>identifier.name)
      if (!member) {
        for (const member of this.members.values()) {
          const ast = member.findOne?.(identifier)
          if (ast) return ast
        }
      } else {
        console.log(`find success! ${member.name}`)
        return member
      }
    }
    return undefined
  }

  findAll(identifier: Identifier): Identifier[] | undefined {
    let items: Identifier[] = []
    if (this.contains(identifier)) {
      if (this.name === identifier.name) items.push(this)
      this.members.forEach((member) => {
        const is = member.findAll?.(identifier)
        if (is) items = items.concat(is)
      })
    }
    if (items.length > 0) {
      return items
    }
    return undefined
  }

  add(ast: Identifier) {
    this.members.set(ast.name, ast)
  }

  symbolKind(): SymbolKind {
    return SymbolKind.Class
  }

  completionItemKind(): CompletionItemKind {
    return CompletionItemKind.Class
  }

  documentSymbol(document?: vscode.TextDocument): vscode.DocumentSymbol {
    const item = new vscode.DocumentSymbol(this.name, '', this.symbolKind(), this.scope!, this.scope!)
    this.members.forEach((member) => {
      item.children.push(
        new vscode.DocumentSymbol(member.name, member.detail!, <SymbolKind>member.symbolKind?.(), member.scope!, member.scope!)
      )
    })
    return item
  }

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover> {
    const range = document.getWordRangeAtPosition(position)
    const identifier = <Identifier>{
      name: document.getText(range),
      point: position,
      uri: document.uri,
    }
    console.log(`identifier = ${JSON.stringify(identifier, null, 2)}`)
    let item
    const member = this.findOne(identifier)
    if (member) {
      console.log(member.toString!())
      item = new vscode.Hover([member.name, member.detail ?? ''])
    }
    return item
  }

  provideDefinition(document: TextDocument, position: Position): ProviderResult<Definition | DefinitionLink[]> {
    const range = document.getWordRangeAtPosition(position)
    const identifier = <Identifier>{
      name: document.getText(range),
      point: position,
      uri: document.uri,
    }
    let item
    const member = this.findOne(identifier)
    if (member) {
      console.log(member.toString!())
      item = new Location(member.uri ?? document.uri, member.scope ?? position)
    }
    return item
  }

  provideRenameEdits(identifier: Identifier, newName: string, edit: WorkspaceEdit): void {
    const members = this.findAll(identifier)
    if (members && members.length > 0) {
      console.log(members)
      members?.forEach((member) => edit.replace(<vscode.Uri>member.getUri?.(), member.scope!, newName))
    }
  }
}

export interface VscodeInterface {
  documentSymbol?(document?: vscode.TextDocument): vscode.DocumentSymbol
  provideHover?(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.Hover>
  provideDefinition?(document: TextDocument, position: Position): ProviderResult<Definition | DefinitionLink[]>
  provideRenameEdits?(identifier: Identifier, newName: string, edit: WorkspaceEdit): void
}
