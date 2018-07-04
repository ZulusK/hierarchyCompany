const _ = require("lodash");

class AbstractDriver {

    constructor(model) {
        this._model = model;
    }

    async contains(query) {
        return (await this._model.paginate(query, {limit: 0})).total > 0;
    }

    buildSearchQuery(data) {
        return Object
            .keys(data)
            .reduce((result, key) => {
                const value = data[key];
                if (_.isArray(value)) {
                    result[key] = {$in: value};
                } else if (_.isString(value)) {
                    result[key] = new RegExp(value);
                } else if (_.isObject(value)) {
                    result[key] = this.buildSearchQuery(value);
                } else {
                    result[key] = value;
                }
                return result;
            }, {});
    }

    get model() {
        return this._model;
    }

    find(query) {
        return this._model.find(query).exec();
    }

    getFieldsById(id, fields) {
        return this._model.findById(id).select(fields).exec();
    }

    getFields(query, fields) {
        return this._model.find(query).select(fields).exec();
    }

    findOne(query) {
        return this._model.findOne(query).exec();
    }

    findPaginated(query, pagination) {
        return this._model.paginate(query, pagination);
    }

    findById(id) {
        return this._model.findById(id).exec();
    }

    async count() {
        return this._model.count({}).exec();
    }

    create(args) {
        const instance = new this._model(args);
        return instance.save();
    }

    removeById(id) {
        return this._model.findByIdAndRemove(id).exec();
    }

    remove(query) {
        return this._model.remove(query).exec();
    }

}

module.exports=AbstractDriver;