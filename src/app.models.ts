export interface Doc {
    _id?: string;
    createdAt?: number;
    updatedAt?: number;
    _path: string;
    _backslashes: number;
    _temp?: null;
}

export interface Note extends Doc {
    _event: NoteEvent;
}

export enum NoteEvent {
    INSERT = 10,
    UPDATE = 20,
    REMOVE = 30
}
