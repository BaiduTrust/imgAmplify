/**
 * @file 图片放大初始化模块
 * @author lizhaoxia(lizhaoxia@baidu.com)
 * @date 2014-05-14
 */

define(function (require) {
    var ImgAmplify = require('./imgAmplify');

    function init() {
        var imgLists = $('div[data-img-type="imgAmplify"]');

        imgLists.each(function (index, item) {
            new ImgAmplify({
                expandPrefix: 'img-expand',
                source: item
            });
        });
    }

    return {
        init: init
    };
});
