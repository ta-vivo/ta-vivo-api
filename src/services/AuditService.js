import axios from 'axios';

class Audit {

  /**
   * It creates an axios instance with the base URL of the audit service and the authorization token
   * @returns An axios instance
   */
  static getAxiosInstance() {
    let instance;
    if (process.env.ENVIRONMENT === 'production') {
      instance = axios.create({
        baseURL: process.env.AUDIT_SERVICE_API,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUDIT_SERVICE_API_TOKEN}`
        }
      });

    } else {
      instance = {
        post: () => {
          // eslint-disable-next-line no-undef
          return new Promise(resolve => {
            resolve('fake success');
          });
        },
      };
      console.log('⚠️ In "development" mode the Audit service is disabled');
    }

    return instance;
  }

  static async onUpdate(user, { action, entity, old, edited }) {
    try {
      const data = {
        userId: user.id,
        action: action || 'update',
        metaData: {
          entity,
          old,
          edited
        },
      };

      this.getAxiosInstance()
        .post('/logs', data)
        .catch(error => {
          if (error.response && error.response.data) {
            console.log('🔥  error on save audit log', error.response.data);
          } else if (error.code === 'ECONNREFUSED') {
            console.log('🔥  The audit service is not running');
          }
        });

      return;
    } catch (error) {
      console.log('🔥 error on save audit log');
    }
  }

  static async onDelete(user, deleted) {
    try {
      const data = {
        userId: user.id,
        action: 'delete',
        metaData: {
          deleted
        },
      };

      this.getAxiosInstance()
        .post('/logs', data)
        .catch(error => {
          if (error.response && error.response.data) {
            console.log('🔥  error on save audit log', error.response.data);
          } else if (error.code === 'ECONNREFUSED') {
            console.log('🔥  The audit service is not running');
          }
        });

      return;
    } catch (error) {
      console.log('🔥 error on save audit log');
    }
  }

}

export default Audit;