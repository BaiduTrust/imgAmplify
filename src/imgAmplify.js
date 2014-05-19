/**
 * @file 图片放大主模块
 * @author lizhaoxia(lizhaoxia@baidu.com)
 * @date 2014-05-14
 */

define(function (require) {
    var etpl = require('etpl');
    var tpl = require('text!./tpl.html');
    /**
     * 图片展开放大
     * 
     * @constructor
     * @exports
     * @param {Object} options 配置项
     */
    function ImgAmplify(options) {
        $.extend(this, options);
        $(this.source).bind('click', this.getExpandImgHandler());
    }

    /**
     * ImgAmplify新增prototype属性
     * 
     * @type {Object}
     */
    var proto = {
        /**
         * 获取展开图片的处理函数
         * 
         * @private
         * @return {Function}
         */
        getExpandImgHandler: function () {
            var me = this;

            return function (e) {
                e.preventDefault();
                var target = e.target;
                var targetTagName = target.tagName.toLowerCase();
                if (targetTagName !== 'a' && targetTagName !== 'img') {
                    return;
                }
                else if (targetTagName === 'img') {
                    target = $(target).parent()[0];
                }

                // 若第一次展开，则插入节点，绑定事件
                if (!me.expanded) {
                    me.expandInit();
                    me.bindEvent();
                    me.index = -1;
                }

                var index = me.originImgLinks.index(target);
                me.expand(index);
            };
        },

        /**
         * 展开图片初始化操作
         * 
         * @private
         */
        expandInit: function () {
            // 生成图片展开节点
            var src = $(this.source);
            src.after('<div class="' + this.expandPrefix + '-container" style="display:none;"></div>');
            this.expandEle = src.next()[0];

            // 生成一个临时img节点
            var tempImg = $('<img>', {style: 'position:absolute; left: -10000px; top:0;'})[0];
            document.body.appendChild(tempImg);
            this.tempImg = tempImg;

            // 抽取缩略图和大图url数据
            var src = $(this.source);
            var originImgLinks = src.find('a');
            var sUrls = [];
            var bUrls = [];
            $.each(originImgLinks, function (index, imgLink) {
                var img = $(imgLink).children()[0];
                sUrls.push($(img).attr('src'));
                bUrls.push($(imgLink).attr('href') || $(img).attr('src'));
            });
            this.originImgLinks = originImgLinks;
            this.sUrls = sUrls;
            this.bUrls = bUrls;

            // 插入图片展开DOM
            var data = {
                'sUrls': this.sUrls,
                'expandPrefix': this.expandPrefix
            };
            var render = etpl.compile(tpl);
            var html = render(data);
            this.expandEle.innerHTML = html;
            this.expandImgWrapper = $(this.expandEle).find('.' + this.expandPrefix + '-main-img')[0];
            this.expandImg = $(this.expandImgWrapper).find('img')[0];
            this.expanded = true;
        },

        /**
         * 绑定事件
         * 
         * @private
         */
        bindEvent: function () {
            $(this.tempImg).bind('load', this.getImgLoadedHandler());

            // 为展开后的缩略图绑定事件
            $(this.expandEle).find('.' + this.expandPrefix + '-small-img img').bind(
                'click', this.getSImgClickHandler()
            );

            // 为展开图片区域绑定mousemove事件
            $(this.expandImgWrapper).bind('mousemove', this.getExpandWrapperMvHandler());

            // 为展开图片区域绑定click事件
            $(this.expandImgWrapper).bind('click', this.getExpandWrapperClickHandler());
        },

        /**
         * 获取临时图片加载成功后的事件处理函数
         * 
         * @private
         * @return {Function}
         */
        getImgLoadedHandler: function () {
            var me = this;

            return function () {
                $(me.expandImgWrapper).removeClass('loading');

                if (me.imgLoading) {
                    me.show();
                    $($(me.source).find('img')[me.index]).css({
                        'opacity': 1,
                        'filter': 'alpha(opacity=100)'
                    });
                }

                me.resizeImg();
                me.expandImg.src = me.bUrls[me.index];

                if (!me.imgLoading) {
                    $(me.expandImg).animate({
                        opacity: '1'
                    }, 500);
                }

                if (me.imgLoading) {
                    me.imgLoading = false;
                }
            };
        },

        /**
         * 根据临时图片的尺寸调整展开图片大小，限制宽度，保持宽高比
         * 
         * @private
         */
        resizeImg: function () {
            var tempImg = this.tempImg;
            var originWidth = tempImg.width;
            var originHeight = tempImg.height;
            var wrapperWidth = this.expandImgWrapper.offsetWidth;

            // 原图宽度小于wrapper宽度
            if (originWidth < wrapperWidth) {
                $(this.expandImg).css('width', originWidth + 'px');
            }
            else {
                $(this.expandImg).css('width', wrapperWidth + 'px');
            }
        },

        /**
         * 获取展开后缩略图部分点击事件处理函数
         * 
         * @private
         * @return {Function}
         */
        getSImgClickHandler: function () {
            var me = this;

            return function (e) {
                e.preventDefault();
                var index = parseInt($(this).parent().attr('data-index'));
                me.turnTo(index);
            }
        },

        /**
         * 转到指定索引的某张图片
         * 
         * @param {number} index 目标图片的索引
         */
        turnTo: function (index) {
            var prevIndex = this.index;
            if (prevIndex === index) {
                return;
            }

            if (index < 0 || index > this.bUrls.length - 1) {
                this.hide();
                return;
            }

            if (!this.imgLoading) {
                this.scrollPos(this.expandEle);

                $(this.expandImg).css({
                    'opacity': 0,
                    'filter': 'alpha(opacity=0)'
                });

                $(this.expandImgWrapper).addClass('loading');
            }

            this.index = index;
            this.tempImg.src = this.bUrls[index];

            var sLinkList = $(this.expandEle).find('.' + this.expandPrefix + '-small-img a');
            $(sLinkList[prevIndex]).removeClass('current');
            $(sLinkList[index]).addClass('current');
        },

        /**
         * 获取图片展开区域mouseover事件处理函数
         * 
         * @private
         * @return {Function}
         */
        getExpandWrapperMvHandler: function () {
            var me = this;

            return function (e) {
                var offsetGap = e.pageX - $(this).offset().left;
                var wrapperWidth = $(this).width();
                var wrapper = $(me.expandImgWrapper);

                // 若鼠标在图片左边1/3区域，并且当前不为第一张图片，则可向前翻页
                if (offsetGap < wrapperWidth / 3 && me.index > 0) {
                    wrapper.removeClass('next');
                    wrapper.addClass('prev');
                }
                // 若鼠标在图片右边1/3区域，且当前不为最后一张图片，则可向后翻页
                else if (offsetGap > wrapperWidth * 2 / 3 && me.index < me.sUrls.length - 1) {
                    wrapper.removeClass('prev');
                    wrapper.addClass('next');
                }
                // 其他情况为缩小指针
                else {
                    wrapper.removeClass('prev');
                    wrapper.removeClass('next');
                }
            }
        },

        /**
         * 获取图片展开区域click事件处理函数
         * 
         * @private
         * @return {Function}
         */
        getExpandWrapperClickHandler: function () {
            var me = this;

            return function () {
                if ($(this).hasClass('prev')) {
                    me.turnTo(me.index - 1);
                }
                else if ($(this).hasClass('next')) {
                    me.turnTo(me.index + 1);
                }
                else {
                    me.hide();
                }
            }
        },

        /**
         * 展开大图
         * 
         * @param {number} index 展开大图的索引
         */
        expand: function (index) {
            // 需要加载图片
            if (index !== this.index) {
                $($(this.source).find('img')[index]).css({
                    'opacity': '0.5',
                    'filter': 'alpha(opacity=50)'
                });
                this.imgLoading = true;
                this.turnTo(index);
            }
            // 直接展开
            else {
                this.show();
            }
        },

        show: function () {
            $(this.source).hide();
            $(this.expandEle).show();
        },

        /**
         * 收起大图
         * 
         * @private
         */
        hide: function () {
            $(this.expandEle).hide();
            $(this.source).show();
            this.scrollPos(this.source);
        },

        /**
         * 若目标节点的起始位置在视觉范围之外，将页面滚动到目标元素的位置
         * 
         * @param {HTMLElement} target 目标节点
         */
        scrollPos: function (target) {
            var offsetTop = $(target).offset().top;
            if ($(document).scrollTop() > offsetTop) {
                $(document).scrollTop(offsetTop - 50);
            }
        }
    }

    $.extend(ImgAmplify.prototype, proto);

    return ImgAmplify;
});