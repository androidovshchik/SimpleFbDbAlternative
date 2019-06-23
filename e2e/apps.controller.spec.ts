import {Test} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {AppModule} from '../src/app.module';
import {AppController} from '../src/app.controller';

AppModule.TEST = true;
AppModule.DEBUG = true;

describe('App', () => {
    let app: INestApplication;

    const POST = (url: string, body: any, expect: any = {"_error": null}): any => {
        return request(app.getHttpServer())
            .post(url)
            .set('User-Agent', AppController.USER_AGENT)
            .send(body)
            .expect(200)
            .expect(expect);
    };
    const PUT = (url: string, body: any, expect: any = {"_error": null}): any => {
        return request(app.getHttpServer())
            .put(url)
            .set('User-Agent', AppController.USER_AGENT)
            .send(body)
            .expect(200)
            .expect(expect);
    };
    const GET = (url: string, expect: any): any => {
        return request(app.getHttpServer())
            .get(url)
            .set('User-Agent', AppController.USER_AGENT)
            .expect(200)
            .expect(expect);
    };
    const DELETE = (url: string, expect: any): any => {
        return request(app.getHttpServer())
            .delete(url)
            .set('User-Agent', AppController.USER_AGENT)
            .expect(200)
            .expect(expect);
    };

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = module.createNestApplication();
        await app.init();
    });

    it(`Getting root doc`, () => GET('/db/store/doc/', {
        _path: '',
        _backslashes: 0
    }));
    const invalidData = {
        ' $a': 1,
        'b\0': 1,
        'c.d': 1
    };
    const alphabetDoc = {
        'alphabet': {
            ...invalidData,
            ' /e/ ': {
                ...invalidData,
                f: {},
                g: {
                    h: null
                },
                i: {
                    ...invalidData,
                    j: 1
                }
            },
            '\\ k ': [{
                ...invalidData,
                l: {},
                m: {
                    n: null
                },
                o: {
                    ...invalidData,
                    p: 1
                }
            }],
            q: null,
            '': {
                r: "stuvwxyz"
            },
            ' ': 1,
            '   ': 1,
            0: [1, 2, 3, 4, 5]
        }
    };
    it(`Inserting alphabet doc`, () => POST('/db/store/doc/', alphabetDoc));
    it(`Getting alphabet doc`, () => GET('/db/store/doc/alphabet', {
        '0': [1, 2, 3, 4, 5],
        _path: 'alphabet',
        _backslashes: 1,
        '\\ k ': [{
            l: {},
            m: {},
            o: {
                p: 1
            }
        }],
        '': {
            r: 'stuvwxyz'
        },
        ' ': 1,
        '   ': 1,
        e: {
            _backslashes: 2,
            _path: 'alphabet/e',
            f: {
                _backslashes: 3,
                _path: 'alphabet/e/f'
            },
            g: {
                _backslashes: 3,
                _path: 'alphabet/e/g'
            },
            i: {
                j: 1,
                _backslashes: 3,
                _path: 'alphabet/e/i'
            }
        }
    }));
    it(`Getting alphabet collection`, () => GET('/db/store/collection/alphabet', [{
        _backslashes: 2,
        _path: 'alphabet/e',
        f: {
            _backslashes: 3,
            _path: 'alphabet/e/f'
        },
        g: {
            _backslashes: 3,
            _path: 'alphabet/e/g'
        },
        i: {
            j: 1,
            _backslashes: 3,
            _path: 'alphabet/e/i'
        }
    }]));

    afterAll(async () => {
        await app.close();
    });
});
