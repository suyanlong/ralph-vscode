import vscode, { Uri } from 'vscode'
import path from 'path'
import { Root } from './root'
import { Identifier } from './identifier'
import { Word } from './word'
import { Position } from './position'

export class MultiProjects {
  projects: Map<string, Root>

  constructor() {
    this.projects = new Map<string, Root>()
  }

  projectDir(projectPath: Uri | string): string {
    if (projectPath instanceof Uri) {
      if (vscode.workspace.rootPath) projectPath.path.split(vscode.workspace.rootPath)[1].split(path.sep)[0]
      return 'root'
    }
    return <string>projectPath
  }

  merge(path: Uri, members: Identifier[]) {
    const dir = this.projectDir(path)
    if (this.projects.get(dir)) {
      this.root(path)?.merge(path, members)
    } else {
      const root = new Root()
      root.merge(path, members)
      this.projects.set(dir, root)
    }
  }

  remove(path: Uri) {
    return this.root(path)?.remove(path)
  }

  def(path: Uri | string, word: Word): Identifier | undefined {
    return this.root(path)?.def(word)
  }

  defs(path: Uri | string): Identifier[] {
    const root = this.root(path)
    if (root) return root.defs()
    return []
  }

  get(path: Uri | string, name: string): Identifier | undefined {
    return this.root(path)?.get(name)
  }

  container(path: Uri | string, position: Position): Identifier | undefined {
    return this.root(path)?.container(position)
  }

  findAll(path: Uri | string, identifier: Word): Identifier[] {
    const root = this.root(path)
    if (root) return root.findAll(identifier)
    return []
  }

  root(path: Uri | string): Root | undefined {
    return this.projects.get(this.projectDir(path))
  }

  analyse() {
    this.projects.forEach((root) => root.analyse())
  }
}
