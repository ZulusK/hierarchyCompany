| Master |  Dev    |
| ------: | ------ |
| [![Build Status][travis-master]](https://travis-ci.org/ZulusK/chatter) | [![Build Status][travis-dev]](https://travis-ci.org/ZulusK/chatter) |

[DEMO](https://chatter-job-task.herokuapp.com/)

[Postman test](https://documenter.getpostman.com/view/3031705/RWM6xsGV)

[Swagger API doc](https://app.swaggerhub.com/apis/ZulusK/chatter/1.0.0#/)
# Short Description
The NodeJS app - a simple public chat. Where unauthenticated users can post text and everyone else can read them.
Posts stored in database, and users can get or create posts by using REST API.

# Basic requirements
- Post must contain username and text.
- Before save a post check that text is less than 200 symbols and username contains only letters and numbers.
- REST API should have 2 endpoints:
  1. Get all posts.
  2. Create post. Should return error if text or username failed validation.
- Postman collection for testing
- Documentation using swagger

# Additional requirements (Nice to have)
- Preferably use Mongo or PostgreSQL.
- Write tests for endpoints, so we can easily make sure that API is work.
- Use Sequelize or another ORM.
- Deploy using Digital Ocean or etc.
- Use docker container and deploy using CI/CD (for example Wercker).
- JWT Authentication\Authorization


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

[travis-master]: https://travis-ci.org/ZulusK/chatter.svg?branch=master
[travis-dev]:https://travis-ci.org/ZulusK/chatter.svg?branch=dev