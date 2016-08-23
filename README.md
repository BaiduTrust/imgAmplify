# imgAmplify

## 简介

类似微博的图片查看组件，支持展开、收起、查看原图功能。

<img src="tmp/screenshot_1.png" width="600">

## 使用方法

```javascript

var imgAmplify = require('imgAmplify');

imgAmplify.init({
    main: '#container' // 初始化的范围（可选，默认是body）
    scrollElem: '.scroll-container' // 如果当前可滚动的元素不是body，则需要设置(可选，默认是body)
    expandPrefix: 'kb-' // class前缀（可选，默认是img-expand）
});

```

## 依赖

- jquery-1.9.0
- etpl
