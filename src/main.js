/**
 * @file 图片放大初始化模块
 * @author lizhaoxia(lizhaoxia@baidu.com)
 *         wuqi03(wuqi03@baidu.com)
 *         chengong03(chengong03@baidu.com)
 * @date 2018-08-23
 */

define(function (require) {
    var ImgAmplify = require('./imgAmplify');

    /**
     * 初始化图片查看器
     *
     * @param {Object} opts 配置参数
     */
    function init(opts) {
        opts = opts || {};
        var imgLists = $('[data-img-type="imgAmplify"]', $(opts.main || 'body'));

        imgLists.each(function (index, item) {
            var obj = {
                expandPrefix: 'img-expand',
                source: item
            };
            $.extend(obj, opts || {});
            new ImgAmplify(obj);
        });
    }

    return {
        init: init
    };
});
