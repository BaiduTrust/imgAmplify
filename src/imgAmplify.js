/**
 * @file 图片放大主模块
 * @author lizhaoxia(lizhaoxia@baidu.com)
 *         chengong03(chengong03@baidu.com)
 * @date 2014-05-14
 */

define(function (require) {

    var etpl = require('etpl');
    var smallImgWidth = 106; // 缩略图宽度

    var tpl = ''
        + '<div class="${expandPrefix}-action">'
        +   '<a href="" class="${expandPrefix}-original" target="_blank" title="查看原图"><i></i>查看原图</a>'
        +   '<a href="#" onclick="return false;" class="${expandPrefix}-rotate-right" title="向右旋转"><i></i>向右旋转</a>'
        + '</div>'
        + '<div class="${expandPrefix}-main-img">'
        +   '<img src="" />'
        + '</div>'
        + '<div class="${expandPrefix}-small-img-container">'
        +   '<% if: ${sUrls.length} %>'
        +     '<div class="${expandPrefix}-switch-left ${expandPrefix}-switch"><i data-switch="left"></i></div>'
        +   '<% /if %>'
        +   '<% if: ${sUrls.length} %>'
        +     '<div class="${expandPrefix}-switch-right ${expandPrefix}-switch"><i data-switch="right"></i></div>'
        +   '<% /if %>'
        +   '<% var: smallImgUlWidth = ${sUrls.length} * ${smallImgWidth} %>'
        +   '<% var: smallImgWrapWidth = ${smallImgNum} * ${smallImgWidth} %>'
        +   '<div class="${expandPrefix}-small-img-wrap <% if: !${sUrls.length} %>hidden<%/if%>" '
        +   'style="width:${smallImgWrapWidth}px" data-a="${smallImgUlWidth} - ${smallImgWrapWidth}">'
        +       '<ul class="${expandPrefix}-small-img" style="width:${smallImgUlWidth}px">'
        +             '<% for: ${sUrls} as ${sUrl}, ${i} %>'
        +             '<li>'
        +                 '<a href="" data-index="${i}"><img src="${sUrl}" /></a>'
        +             '</li>'
        +             '<% /for %>'
        +       '</ul>'
        +   '</div>'

        + '</div>';

    var etplEngine = new etpl.Engine({
        commandOpen: '<%',
        commandClose: '%>'
    });

    // 共用一个render即可
    var render = etplEngine.compile(tpl);

    /**
     * 是否支持css3的transition
     *
     * @private
     * @return {boolean} 支持状态
     */
    var supportTransition = (function () {
        var s = document.createElement('p').style;
        var r = 'transition' in s
            || 'WebkitTransition' in s
            || 'MozTransition' in s
            || 'msTransition' in s
            || 'OTransition' in s;
        s = null;
        return r;
    })();

    /**
     * 旋转
     *
     * @private
     * @param {(string | HTMLElement)} target 目标元素
     * @param {number} deg 角度
     */
    function rotate(target, deg) {
        if (supportTransition) {
            var degStr = 'rotate(' + deg + 'deg)';
            $(target).css({
                '-webkit-transform': degStr,
                '-mos-transform': degStr,
                '-o-transform': degStr,
                'transform': degStr
            });
        }
        else {
            var ieRotate = ~~((deg / 90) % 4 + 4) % 4;
            $(target).css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + ieRotate +')');
        }
    }

    /**
     * 图片展开放大
     *
     * @constructor
     * @exports
     * @param {Object} options 配置项
     */
    function ImgAmplify(options) {
        $.extend(this, options);
        $(this.source).unbind('click').bind('click', this.getExpandImgHandler());
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
                // console.log(111);
                e.preventDefault();
                var target = e.target;
                var targetTagName = target.tagName.toLowerCase();
                // modify by liulangyu
                // if (targetTagName !== 'a' && targetTagName !== 'img' && targetTagName !== 'div') {
                if (targetTagName !== 'a' && targetTagName !== 'img') {
                    return;
                }

                target = $(target).parents('a').eq(0)[0];

                // 若第一次展开，则插入节点，绑定事件
                if (!me.expanded) {
                    me.expandInit(); // 插入节点
                    me.bindEvent(); // 渲染事件
                    me.index = -1;
                }

                var index = me.originImgLinks.index(target);
                me.expand(index); // 打开缩略图
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
            // FIXME no need to append
            // document.body.appendChild(tempImg);
            this.tempImg = tempImg;

            // 抽取缩略图和大图url数据
            var src = $(this.source);
            var originImgLinks = src.find('a');
            var sUrls = []; // 缩略图列表
            var bUrls = []; // 原图列表
            var fileInfos = {};

            $.each(originImgLinks, function (index, imgLink) {
                var img = $(imgLink).find('img')[0];
                sUrls.push($(img).attr('src'));
                bUrls.push($(imgLink).attr('href') || $(img).attr('src'));
                fileInfos[index] = fileInfos[index] || {};
                fileInfos[index].rotate = parseInt($(imgLink).attr('data-rotate') || 0, 10);
            });
            this.originImgLinks = originImgLinks;
            this.sUrls = sUrls;
            this.bUrls = bUrls;
            this.fileInfos = fileInfos;
            this.smallImgNum = this.smallImgNum || 6;

            // 插入图片展开DOM
            var data = {
                'sUrls': this.sUrls,
                'expandPrefix': this.expandPrefix,
                'smallImgWidth': smallImgWidth,
                'smallImgNum': this.smallImgNum
            };

            // modify 如果只有一张，不显示缩略图
            if (this.sUrls.length <= 1) {
                data.sUrls = [];
            }
            // var render = etpl.compile(tpl);
            var html = render(data);
            this.expandEle.innerHTML = html;
            this.expandImgWrapper = $(this.expandEle).find('.' + this.expandPrefix + '-main-img')[0];
            this.expandImg = $(this.expandImgWrapper).find('img')[0];
            this.expandOriginal = $(this.expandEle).find('.' + this.expandPrefix + '-original')[0];
            this.expandSwitch = $(this.expandEle).find('.' + this.expandPrefix + '-switch i');
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
            $(this.expandEle).find('.' + this.expandPrefix + '-small-img a').bind(
                'click', this.getSImgClickHandler()
            );

            // 为展开后的缩略图的左右绑定事件
            $(this.expandSwitch).bind('click', this.getSwitchClickHandler());

            // 为展开图片区域绑定mousemove事件
            $(this.expandImgWrapper).bind('mousemove', this.getExpandWrapperMvHandler());

            // 为展开图片区域绑定click事件
            $(this.expandImgWrapper).bind('click', this.getExpandWrapperClickHandler());
            // action
            $(this.expandEle).find('.' + this.expandPrefix + '-action').bind('click', this.getActionClickHandler());
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
                var bUrl = me.bUrls[me.index];
                me.expandImg.src = bUrl;

                $(me.expandOriginal).attr('href', bUrl);

                // 初始化角度
                var deg = me.fileInfos[me.index].rotate;
                if (deg) {
                    me.rotateImage(deg, true);
                }

                if (!me.imgLoading) {
                    $(me.expandImg).animate({
                        opacity: '1'
                    }, 500);
                }

                if (me.imgLoading) {
                    me.imgLoading = false;
                }

                me.scrollPos(me.expandEle);
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
            var wrapperWidth = this.expandImgWrapper.offsetWidth;

            this.fileInfos[this.index] = this.fileInfos[this.index] || {};
            this.fileInfos[this.index].width = originWidth;
            this.fileInfos[this.index].height = tempImg.height;

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
                var index = parseInt($(this).attr('data-index'), 10);
                me.turnTo(index);
            };
        },

        /**
         * 获取展开后缩略图左右箭头点击事件处理函数
         *
         * @private
         * @return {Function}
         */
        getSwitchClickHandler: function () {
            var me = this;

            return function (e) {
                e.preventDefault();

                var isFirstImg = (me.index === 0);
                var isLastImg = (me.index === me.sUrls.length - 1);
                var target = $(e.target);

                if (target.attr('data-switch') === 'left' && !isFirstImg) {
                    me.turnTo(me.index - 1);
                }
                else if (target.attr('data-switch') === 'right' && !isLastImg) {
                    me.turnTo(me.index + 1);
                }
            };
        },

        /**
         * 更新缩略图列表
         *
         * @private
         */
        updataThumbList: function () {

            var thumbList = $(this.expandEle).find('.' + this.expandPrefix + '-small-img');
            var thumbLen = this.sUrls.length;

            if (thumbLen > this.smallImgNum) { // 溢出
                if (this.index < 2) {
                    thumbList.css({
                        left: 0
                    });
                }
                else if (this.index < thumbLen - this.smallImgNum + 3) {
                    thumbList.animate(
                        {
                            left: -smallImgWidth * this.index + smallImgWidth * 2
                        },
                        300
                    );
                }
                else {
                    thumbList.animate(
                        {
                            left: -smallImgWidth * (thumbLen - this.smallImgNum)
                        },
                        300
                    );
                }
            }

            // 更新switch
            $(this.expandSwitch).removeClass('disable');
            if (this.index === 0) {
                $(this.expandSwitch).filter('[data-switch=left]').addClass('disable');
            }
            else if (this.index === this.sUrls.length - 1) {
                $(this.expandSwitch).filter('[data-switch=right]').addClass('disable');
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
                $(this.expandImg).css({
                    'opacity': 0,
                    'filter': 'alpha(opacity=0)'
                });

                $(this.expandImgWrapper).addClass('loading');
            }

            this.index = index;

            // 重置
            this.resetStyles();

            // 重置图片大小
            this.resizeImg();

            if (this.tempImg.src === this.bUrls[index]) {
                if (!this.imgLoading) {
                    $(this.expandImg).css({
                        opacity: '1'
                    });
                }
                $(this.expandImgWrapper).removeClass('loading');
            }

            this.tempImg.src = this.bUrls[index];

            var sLinkList = $(this.expandEle).find('.' + this.expandPrefix + '-small-img a');
            $(sLinkList[prevIndex]).parent().removeClass('current');
            $(sLinkList[index]).parent().addClass('current');

            // 更新缩略图列表
            this.updataThumbList();
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
                // original
                // if (
                //     $(e.target)
                //         .add($(e.target).parents('.' + me.expandPrefix + '-original'))
                //         .hasClass(me.expandPrefix + '-original')
                // ) {
                //     return;
                // }

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
            };
        },

        /**
         * 获取图片展开区域click事件处理函数
         *
         * @private
         * @return {Function}
         */
        getExpandWrapperClickHandler: function () {
            var me = this;

            return function (e) {
                if ($(this).hasClass('prev')) {
                    me.turnTo(me.index - 1);
                }
                else if ($(this).hasClass('next')) {
                    me.turnTo(me.index + 1);
                }
                else {
                    me.hide();
                }
            };
        },

        /**
         * action区域点击
         */
        getActionClickHandler: function () {
            var self = this;

            return function (e) {
                if (
                    $(e.target)
                        .add($(e.target).parents('.' + self.expandPrefix + '-rotate-right'))
                        .hasClass(self.expandPrefix + '-rotate-right')
                ) {
                    self.rotateImage();
                }
            };
        },

        /**
         * 旋转
         *
         * @private
         * @param {number=} deg 需要顺时针旋转角度
         * @param {boolean=} isNoAnimation 是否不需要动画
         */
        rotateImage: function(deg, isNoAnimation) {
            deg = deg || (parseInt(this.currentRotate || 0, 10) + 90);
            this.currentRotate = deg;
            var target = $(this.expandImg);
            rotate(target, deg);

            if (!isNoAnimation) {
                $(this.expandImg).addClass('rotate');
            }

            // resize，简单处理，只处理90°倍数的问题，其它的可以通过getBoundClientRect
            var wrapperWidth = this.expandImgWrapper.offsetWidth;

            var isHorizontal = deg % 180 === 0;
            var info = this.fileInfos[this.index];

            var afterWidth = info[isHorizontal ? 'width' : 'height'];
            var afterHeight = info[isHorizontal ? 'height' : 'width'];

            // 原图宽度小于wrapper宽度
            if (afterWidth < wrapperWidth) {
                target.css({
                    width: info.width,
                    height: info.height
                });
            }
            else {
                if (isHorizontal) {
                    target.css({
                        width: wrapperWidth,
                        height: 'auto'
                    });
                }
                else {
                    target.css({
                        height: wrapperWidth,
                        width: 'auto'
                    });
                }
            }

            if (isHorizontal) {
                $(this.expandImgWrapper).css({
                    height: 'auto'
                });
                $(this.expandImg).css({
                    position: 'static',
                    left: 'auto',
                    top:' auto'
                });
            }
            else {
                var w = parseInt(target.css('width').replace('px', ''), 10);
                var h = parseInt(target.css('height').replace('px', ''), 10);
                $(this.expandImgWrapper).css({
                    height: w
                });

                $(this.expandImg).css({
                    position: 'absolute',
                    left: (wrapperWidth - h) / 2 - (w - h) / 2,
                    top: (w - h) / 2
                });
            }
        },

        /**
         * 重置样式
         */
        resetStyles: function () {
            this.currentRotate = 0;

            $(this.expandImgWrapper).css({
                height: 'auto'
            });
            $(this.expandImg).css({
                position: 'static',
                left: 'auto',
                top:' auto',
                width: 'auto',
                height: 'auto'
            }).removeClass('rotate');

            rotate($(this.expandImg), 0);
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
            // this.scrollPos(this.source);
        },

        /**
         * 若目标节点的起始位置在视觉范围之外，将页面滚动到目标元素的位置
         *
         * @param {HTMLElement} target 目标节点
         */
        scrollPos: function (target) {
            // TODO 简单处理下，后期改为事件处理
            var offsetTopFix = this.offsetTop || 0;
            var offsetTop = $(target).offset().top;
            if ($(document).scrollTop() > offsetTop - offsetTopFix) {
                $(document).scrollTop(offsetTop - 25 - offsetTopFix);
            }
        }
    };

    $.extend(ImgAmplify.prototype, proto);

    return ImgAmplify;
});
