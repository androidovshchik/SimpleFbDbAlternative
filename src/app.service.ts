import {Injectable, OnModuleDestroy} from '@nestjs/common';
import NeDB from 'nedb';
import {Doc, Note, NoteEvent} from "./app.models";
import LZUTF8 from "lzutf8";
import {Subject} from "rxjs";
import {Folder} from "./folder";
import {AppModule} from "./app.module";
import _ from "lodash";

@Injectable()
export class AppService implements OnModuleDestroy {

    onFight$ = new Subject<Note>();

    private battlesDb: NeDB;

    private storeDb: NeDB;

    constructor() {
        this.battlesDb = new NeDB({
            inMemoryOnly: true,
            timestampData: true
        });
        this.storeDb = new NeDB({
            filename: 'store.db',
            autoload: true,
            onload(error: Error) {
                if (error) {
                    console.error(error);
                }
            },
            beforeDeserialization(line: string): string {
                if (AppModule.DEBUG) {
                    return line;
                } else {
                    return LZUTF8.decompress(line, {
                        inputEncoding: 'BinaryString'
                    });
                }
            },
            afterSerialization(line: string): string {
                if (AppModule.DEBUG) {
                    return line;
                } else {
                    return LZUTF8.compress(line, {
                        outputEncoding: 'BinaryString'
                    });
                }
            }
        });
        this.battlesDb.ensureIndex({
            fieldName: '_path',
            unique: true
        }, error => {
            if (error) {
                console.error(error);
            }
        });
        this.storeDb.ensureIndex({
            fieldName: '_path',
            unique: true
        }, error => {
            if (error) {
                console.error(error);
            }
        });
    }

    insertDocument(dbName: string, folder: Folder, body, callback: (error) => void) {
        const db = dbName == 'battles' ? this.battlesDb : this.storeDb;
        const docs = folder.splitDoc(body);
        if (docs.length > 0) {
            this.removeDocument(dbName, folder, error => {
                if (!error) {
                    db.insert(docs, error => {
                        callback(error);
                        if (!error) {
                            this.getDocument(dbName, folder, (error, document?) => {
                                if (!error) {
                                    this.onFight$.next({
                                        ...document,
                                        _event: NoteEvent.INSERT
                                    })
                                }
                            });
                        }
                    });
                } else {
                    callback(error);
                }
            }, false);
        } else {
            callback(null);
        }
    }

    updateDocument(dbName: string, folder: Folder, body, callback: (error) => void, docs?: Doc[], i?: number) {
        if (!docs) {
            const docs = folder.splitDoc(body);
            if (docs.length > 0) {
                this.updateDocument(dbName, folder, null, callback, docs, 0);
            } else {
                callback(null);
            }
        } else if (i < docs.length) {
            const db = dbName == 'battles' ? this.battlesDb : this.storeDb;
            db.update({
                _path: docs[i]._path
            }, {
                $set: docs[i]
            }, {
                upsert: true
            }, error => {
                if (!error) {
                    this.updateDocument(dbName, folder, null, callback, docs, i + 1);
                } else {
                    callback(error)
                }
            });
        } else {
            callback(null);
            this.getDocument(dbName, folder, (error, document?) => {
                if (!error) {
                    this.onFight$.next({
                        ...document,
                        _event: NoteEvent.UPDATE
                    });
                }
            });
        }
    }

    getDocument(dbName: string, folder: Folder, callback: (error, document?) => void) {
        const db = dbName == 'battles' ? this.battlesDb : this.storeDb;
        if (folder.isNonEmpty()) {
            db.find({
                _path: new RegExp(`^${folder}`)
            }, (error, documents) => {
                if (!error) {
                    callback(null, folder.joinDocs(documents));
                } else {
                    callback(error);
                }
            });
        } else {
            callback(null, folder.joinDocs(db.getAllData()));
        }
    }

    getCollection(dbName: string, folder: Folder, callback: (error, documents) => void) {
        this.getDocument(dbName, folder, (error, document?) => {
            if (!error) {
                const keys = Object.keys(document);
                callback(null, keys.reduce((docs, key) => {
                    if (Folder.format(key).length > 0) {
                        const doc = document[key];
                        if (_.isPlainObject(doc)) {
                            docs.push(doc);
                        }
                    }
                    return docs;
                }, []));
            } else {
                callback(error, [])
            }
        });
    }

    removeDocument(dbName: string, folder: Folder, callback: (error) => void, sendNote = true) {
        const db = dbName == 'battles' ? this.battlesDb : this.storeDb;
        db.remove(folder.isNonEmpty() ? {
            _path: new RegExp(`^${folder}`)
        } : {}, {
            multi: true
        }, (error, number) => {
            callback(error);
            if (!error) {
                if (number > 0) {
                    if (sendNote) {
                        this.onFight$.next({
                            ...folder.toEmptyDoc(),
                            _event: NoteEvent.REMOVE
                        });
                    }
                }
            }
        });
    }

    onModuleDestroy() {
        this.battlesDb.removeIndex('_path', error => {
            if (error) {
                console.error(error);
            }
        });
        this.storeDb.removeIndex('_path', error => {
            if (error) {
                console.error(error);
            }
        });
    }
}
