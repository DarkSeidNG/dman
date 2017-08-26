import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import request from 'supertest';
import { assert } from 'chai';
import app from '../../build/server';
import invalidJson from '../fixtures/invalidFile.json';
import { User, Document, Role } from '../models';

dotenv.config();
const api = request(app);

let token, userToken, fullName, email, password;
let title, accessType, content, owner, userId;

describe('Set the database up for testing', () => {
  beforeEach((done, req, res) => {
    User.destroy({
      where: {},
      truncate: true,
      cascade: true,
      restartIdentity: true
    }).then((err) => {
      done();
    });
  });
  const set = true;
  it('should check if set is `true`', () => {
    if (set) {
      assert.isDefined(set, 'Test environment set up');
    } else {
      const error = new Error('Test environment not set up');
      assert.ifError(error);
    }
  });
});

describe('Document Controller Test Suite', () => {
  describe('Set the database up for testing', () => {
    Document.destroy({
      where: {},
      truncate: true,
      cascade: true,
      restartIdentity: true
    }).then((err) => {
      if (!err) {
        Role.destroy({
          where: {},
          truncate: true,
          cascade: true,
          restartIdentity: true
        });
        Role.bulkCreate([
          {
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            role: 'editor',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);
      }
    });

    const set = true;
    it('set should be true', () => {
      if (set) {
        assert.isDefined(set, 'test is ready');
      } else {
        const error = new Error('test is not ready');
        assert.ifError(error);
      }
    });
  });

  describe('GET `/api/v1/documents`', () => {
    beforeEach((done) => {
      const user = new User();
      User.create({
        fullName: 'Admin',
        email: 'info@admin.com',
        role: 'admin',
        password: user.generateHash('adminhere')
      });
      token = jwt.sign(
        {
          id: 1,
          role: process.env.ADMINROLE,
          fullName: process.env.FULL_NAME
        },
        process.env.JWT_SECRET,
        { expiresIn: '72h' }
      );

      api
        .post('/api/v1/users/auth/register')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({
          fullName: 'Gold Ejikeme',
          email: 'gold.ejikeme@gmail.com',
          password: 'goldejike'
        })
        .expect(200)
        .end((err, res) => {
          if (!err) {
            fullName = res.body.user.fullName;
            email = res.body.user.email;
            password = res.body.user.password;
          }
          done();
        });
    });

    it('should respond with `Not found` if the admin queries all documents', (done) => {
      api
        .get('/api/v1/documents')
        .set('Authorization', `${token}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
        .end((err, res) => {
          if (!err) {
            assert(res.body.message === 'No document found!');
          }
          done();
        });
    });
  });

  describe('POST `/api/v1/documents`', () => {
    beforeEach((done) => {
      api
      .post('/api/v1/users/auth/login')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        email: 'gold.ejikeme@gmail.com',
        password: 'goldejike'
      })
      .expect(200)
      .end((err, res) => {
        if (!err) {
          userToken = res.body.token;
        }
        done();
      });

      api
        .post('/api/v1/documents')
        .set('Authorization', `${token}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({
          title: 'Politik',
          content: 'Waterside and plastic lights. All going down memory lane',
          accessType: 'public',
        })
        .expect(201)
        .end((err, res) => {
          if (!err) {
            title = res.body.title;
            content = res.body.content;
            accessType = res.body.accessType;
            owner = res.body.owner;
            userId = res.body.userId;
          }
          done();
        });

      api
        .post('/api/v1/documents')
        .set('Authorization', `${token}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({
          title: 'The other room',
          content: 'We all belong somewhere. Some belong in the other room',
          accessType: 'public',
        })
        .expect(201)
        .end((err, res) => {
          if (!err) {
            title = res.body.title;
            content = res.body.content;
            accessType = res.body.accessType;
            owner = res.body.owner;
            userId = res.body.userId;
          }
          done();
        });
    });

    it('should respond with `OK` if a document is created successfully by an admin', (done) => {
      api
      .post('/api/v1/documents')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(201)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Document created successfully');
        }
        done();
      });
    });
  });

  describe('POST `/api/v1/documents`', () => {
    it('should respond with `OK` if a document is created successfully by a user', (done) => {
      api
      .post('/api/v1/documents')
      .set('Authorization', `${userToken}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'Trump has been covfefed',
        content: 'We all belong somewhere. Some belong in the other room. Some decide to covfefe',
        accessType: 'user',
      })
      .expect(201)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Document created successfully');
        }
        done();
      });
    });

    it('should respond with `Bad request` if a user passes in the wrong access type', (done) => {
      api
      .post('/api/v1/documents')
      .set('Authorization', `${userToken}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'Have you been covfefed?',
        content: 'We all belong somewhere. Some belong in the other room. Some decide to covfefe',
        accessType: 'admin',
      })
      .expect(400)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Invalid Access Type');
        }
        done();
      });
    });

    it('should respond with `Bad request` when creating a document with a field containing a reverse interger', (done) => {
      api
      .post('/api/v1/documents')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send(invalidJson)
      .expect(400)
      .end((err, res) => {
        if (!err) {
          assert(res.body.errors[0].msg === 'Access Type must be alphanumeric');
        }
        done();
      });
    });

    it('should respond with `Conflict` when creating a document with an already existing title', (done) => {
      api
      .post('/api/v1/documents')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'Politik',
        content: 'New dawn. New day.',
        accessType: 'public',
      })
      .expect(409)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Oops! A document with this title already exists!');
        }
        done();
      });
    });

    it('should respond with `Ok` when creating a new document is created', (done) => {
      api
      .post('/api/v1/documents')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'Poem',
        content: 'New dawn. New day.',
        accessType: 'admin',
      })
      .expect(200)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Document created successfully');
        }
        done();
      });
    });

    it('should respond with `Bad request` if the user passes in a wrong access type', (done) => {
      api
      .post('/api/v1/documents')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'Another Poem',
        content: 'New dawn. New day.',
        accessType: 'user',
      })
      .expect(400)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Invalid Access Type');
        }
        done();
      });
    });

    it('should respond with `Bad request` when some fields are empty', (done) => {
      api
      .post('/api/v1/documents')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        content: 'New dawn. New day.',
        accessType: 'user',
      })
      .expect(400)
      .end((err, res) => {
        if (!err) {
          assert(res.body.errors[0].msg === 'Please enter a title');
        }
        done();
      });
    });
  });

  describe('GET `/api/v1/documents/`', () => {
    it('should respond with `OK` if the admin queries all documents and one or more exist', (done) => {
      api
        .get('/api/v1/documents')
        .set('Authorization', `${token}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (!err) {
            assert(res.body.documents.length >= 1);
          }
          done();
        });
    });

    it('should respond with `OK` if the user queries his/her documents and one or more exist', (done) => {
      api
        .get('/api/v1/documents')
        .set('Authorization', `${userToken}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          if (!err) {
            assert(res.body.documents.length >= 1);
          }
          done();
        });
    });
  });

  describe('GET `/api/v1/documents/:id`', () => {
    it('should respond with `OK` if the document with the same id is found in the database', (done) => {
      api
      .get('/api/v1/documents/1')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Document found!');
        }
        done();
      });
    });

    it('should respond with `OK` if a user queries his/her documents', (done) => {
      api
      .get('/api/v1/documents/3')
      .set('Authorization', `${userToken}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Document found!');
        }
        done();
      });
    });

    it('should respond with `Unauthorized` if a user queries another user\'s document', (done) => {
      api
      .get('/api/v1/documents/5')
      .set('Authorization', `${userToken}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Unauthorized access! ¯¯|_(ツ)_|¯¯');
        }
        done();
      });
    });

    it('should respond with `Bad request` if the id is a non-integer', (done) => {
      api
      .get('/api/v1/documents/1hgyt')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Invalid ID. Please enter a valid ID');
        }
        done();
      });
    });

    it('should respond with `Not found` if the document does not exist', (done) => {
      api
      .get('/api/v1/documents/990')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'This document does not exist!');
        }
        done();
      });
    });
  });

  describe('GET `/api/v1/search/documents`', () => {
    it('should respond with `OK` one or more document is/are found in the search array', (done) => {
      api
      .get('/api/v1/search/documents/?q=Politik')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Document found!');
        }
        done();
      });
    });

    it('should respond with `Not found` if no document is returned', (done) => {
      api
      .get('/api/v1/search/documents/?q=Waterside')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'This document does not exist!');
        }
        done();
      });
    });

    it('should respond with `Bad request` if no search query is passed in', (done) => {
      api
      .get('/api/v1/search/documents/?q=')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Please enter a keyword');
        }
        done();
      });
    });
  });

  describe('PUT `/api/v1/documents/:id`', () => {
    it('should respond with `OK` a document is updated successfully', (done) => {
      api
      .put('/api/v1/documents/2')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'The other roomsssss',
        content: 'We all belong somewhere. Some belong in the other room',
        accessType: 'private',
      })
      .expect(200)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Document Successfully Updated');
        }
        done();
      });
    });

    it('should respond with `Unauthorized` if a user tries to update another user\'s  document', (done) => {
      api
      .put('/api/v1/documents/2')
      .set('Authorization', `${userToken}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'The other one',
        content: 'We all belong somewhere. Some belong in the other room',
        accessType: 'private',
      })
      .expect(403)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Unauthorized Access ¯¯|_(ツ)_|¯¯');
        }
        done();
      });
    });

    it('should respond with `Bad request` if the wrong accessType is passed in', (done) => {
      api
      .put('/api/v1/documents/2')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'The other rooms!',
        content: 'We all belong somewhere. Some belong in the other room',
        accessType: 'user',
      })
      .expect(400)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Invalid Access Type');
        }
        done();
      });
    });

    it('should respond with `Conflict` if a document is updated with an existing title', (done) => {
      api
      .put('/api/v1/documents/2')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'The other roomsssss',
        content: 'We all belong somewhere. Some belong in the other room',
        accessType: 'private'
      })
      .expect(409)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Sorry, this title already exists!');
        }
        done();
      });
    });

    it('should respond with `Bad request` if the id is a non-integer', (done) => {
      api
      .put('/api/v1/documents/iehdy')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'The other roomsssss',
        content: 'We all belong somewhere. Some belong in the other room',
        accessType: 'private'
      })
      .expect(400)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Invalid ID. Please enter a valid ID');
        }
        done();
      });
    });

    it('should respond with `Not found` if the id does not exist', (done) => {
      api
      .put('/api/v1/documents/67')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .send({
        title: 'The other roomsssss',
        content: 'We all belong somewhere. Some belong in the other room',
        accessType: 'private'
      })
      .expect(404)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Sorry, the document does not exist!');
        }
        done();
      });
    });
  });

  describe('DELETE `/api/v1/documents/:id`', () => {
    it('should respond with `OK` a document is deleted successfully', (done) => {
      api
      .delete('/api/v1/documents/2')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Document deleted successfully!');
        }
        done();
      });
    });

    it('should respond with `Bad request` if the id passed in is a non-integer', (done) => {
      api
      .delete('/api/v1/documents/kjfh')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Invalid ID. Please enter a valid ID');
        }
        done();
      });
    });

    it('should respond with `Not found` if the id does not exist', (done) => {
      api
      .delete('/api/v1/documents/90')
      .set('Authorization', `${token}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Document not found! :(');
        }
        done();
      });
    });

    it('should respond with `Unauthorized` if the user tires to delete another user\'s document', (done) => {
      api
      .delete('/api/v1/documents/90')
      .set('Authorization', `${userToken}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(403)
      .end((err, res) => {
        if (!err) {
          assert(res.body.message === 'Unauthorized access! Only an admin can delete a document.');
        }
        done();
      });
    });
  });
});
