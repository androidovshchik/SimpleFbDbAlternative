import {Doc} from './app.models';
import _ from 'lodash';

export class Folder {

    private path = '';

    private length = 0;

    private backslashes = 0;

    constructor(path: string) {
        this.path = Folder.format(path);
        this.length = this.path.length;
        // counts backslashes in [_path]
        // only empty path has zero slashes
        this.backslashes = this.path.split('/').length - (this.length > 0 ? 0 : 1);
    }

    /**
     * Only for upsert queries
     * @param level for debug purposes
     */
    splitDoc(parent: Doc, level = 0, wasDoc = _.isPlainObject(parent)): Doc[] {
        // array or plain object
        if (_.isObjectLike(parent)) {
            // important delete reserved fields
            if (wasDoc) {
                delete parent._id;
                delete parent.createdAt;
                delete parent.updatedAt;
                // allows to process empty objects
                parent._temp = null;
            }
            const keys = Object.keys(parent);
            return keys.reduce((docs, key, i) => {
                if (!/[$.\0]/.test(key)) {
                    const child = parent[key];
                    // undefined value will be removed by nedb
                    if (_.isNull(child)) {
                        parent[key] = undefined;
                    } else if (_.isObjectLike(child)) {
                        const isDoc = wasDoc && _.isPlainObject(child);
                        const path = new Folder(`${this.path}/${key}`);
                        const subchildren = path.splitDoc(child, level + 1, isDoc);
                        if (isDoc) {
                            if (Folder.format(key).length > 0) {
                                docs = docs.concat(subchildren);
                                delete parent[key];
                            }
                        }
                    }
                } else {
                    // nedb doesn't allow such keys
                    delete parent[key];
                }
                // adding parent without extra children at the end
                if (wasDoc) {
                    if (i == keys.length - 1) {
                        docs.push({
                            ...parent,
                            ...this.toEmptyDoc()
                        });
                    }
                }
                return docs;
            }, []);
        }
        return [];
    }

    /**
     * Only for get queries
     */
    joinDocs(children: Doc[]): Doc {
        let parent = this.toEmptyDoc();
        // sort is needed for asc order of paths otherwise some data may be overwritten
        // final order will be kept also in memory which means that sort will be faster
        children.sort((a: Doc, b: Doc) => {
            return a._backslashes > b._backslashes ? 1 : (a._backslashes < b._backslashes ? -1 : 0);
        });
        children.forEach(child => {
            const itself = this.mergeDoc(parent, child);
            if (itself) {
                parent = itself;
            }
        });
        return parent;
    }

    /**
     * @param child it's _path must start with [this.path]
     */
    mergeDoc(parent: Doc, child: Doc): Doc | null {
        if (!this.includes(child._path)) {
            throw Error("Field [_path] of param [child] must start with [this.path]");
        }
        const subpath = Folder.format(child._path.substring(this.length));
        if (subpath.length > 0) {
            _.set(parent, subpath.split("/"), child);
        } else {
            return Object.assign(parent, child);
        }
        return null;
    }

    /**
     * @param subpath must start with [this.path]
     */
    extractDoc(parent: Doc, subpath: string): Doc | null {
        if (!this.includes(subpath)) {
            throw Error("Param [subpath] must start with [this.path]");
        }
        subpath = Folder.format(subpath.substring(this.length));
        if (subpath.length > 0) {
            return _.get(parent, subpath.split("/"), null);
        } else {
            return parent;
        }
    }

    toEmptyDoc(): Doc {
        return {
            _path: this.path,
            _backslashes: this.backslashes
        };
    }

    includes(path: string): boolean {
        return path.startsWith(this.path);
    }

    isNonEmpty(): boolean {
        return this.length > 0;
    }

    toString(): string {
        return this.path;
    }

    /**
     * Removes spaces, tabs, dots, dollar signs, null chars and extra backslashes
     */
    static format(path: string): string {
        return path.replace(/\.|\0|\s|\$/g, '')
            .replace(/\/\/+/g, '/')
            .replace(/^\/|\/$/, '');
    }
}
