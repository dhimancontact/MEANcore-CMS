'use strict';

var async = require('async'),
  moment = require('moment'),
  path = require('path'),
  config = require(path.resolve('./config/config')),
  _ = require('lodash'),
  slugify = config.helpers.slugify,
  googleAnalytics = config.services.googleAnalytics,
  pagesModel = require('../pages/pages.server.model'),
  postsModel = require('../posts/posts.server.model'),
  redirectsModel = require('../redirects/redirects.server.model'),
  mongoose = require('mongoose'),
  User = mongoose.model('User');

var metaTitleSuffix = " | The MEANcore Blog",
  defaultMetaDescription = "MEANcore-CMS is an open source website CMS (Content Management System) and blogging platform developed using the MEAN Stack (MongoDB, Express, AngularJS and Node)."

exports.checkForRedirects = function (req, res, next) {
  var host = req.get('host');
  var url = req.url.toLowerCase();

  // redirects entered into cms
  redirectsModel.getByFrom(url, function (err, redirect) {
    if (err) {
      return res.status(400).send({
        message: err
      });
    }

    if (redirect) {
      // 301 redirect to new url
      return res.redirect(301, redirect.TO);
    }

    next();
  })
}

exports.retrieveSharedData = function (req, res, next) {
  var vm = {};
  async.waterfall([
    function (callback) {
      // return only published posts
      var query = {
        publish: true
      };

      postsModel.getAll(query, null, function (err, posts) {
        if (err) {
          return callback(err);
        }

        vm.posts = posts ? posts : [];

        callback(null);
      });
    },
    function (callback) {
      loadYears(vm, callback);
    },
    function (callback) {
      loadTags(vm, callback);
    }
  ], function (err) {
    if (err) {
      return res.status(400).send({
        message: err
      });
    }

    // posts data no longer required
    delete vm.posts;

    res.status(200).send({
      vm: vm ? vm : []
    })
  })
}

function loadYears(vm, callback) {
  vm.years = [];

  // get all publish dates
  var dates = _.map(vm.posts, 'publishDate');

  // loop through dates and create list of unique years and months
  async.each(dates, function (dateString, cb) {
    var date = moment(dateString);

    var year = _.find(vm.years, {
      value: date.format('YYYY')
    });

    if (!year) {
      year = {
        value: date.format('YYYY'),
        months: []
      };
      vm.years.push(year);
    }

    var month = _.find(year.months, {
      value: date.format('MM')
    });

    if (!month) {
      month = {
        value: date.format('MM'),
        name: moment(date).format('MMMM'),
        postCount: 1
      };
      year.months.push(month);
    } else {
      month.postCount += 1;
    }

    cb(null);
  }, function (err) {
    callback(err);
  });
}

function loadTags(vm, callback) {
  // get unique array of all tags
  vm.tags = _.chain(vm.posts)
    .map('tags')
    .flatten()
    .uniq()
    .sort()
    .filter(function (el) {
      return el;
    }) // remove undefined/null values
    .map(function (tag) {
      return {
        text: tag,
        slug: slugify(tag)
      };
    })
    .value();

  callback(null);
}

exports.retrieveAllPosts = function (req, res, next) {
  // pass in view name to get appropriate meta title
  var forView = req.params.view ? req.params.view : '',
    query = {
      publish: true
    },
    vm = {
      metaTitle: forView + metaTitleSuffix,
      pagination: req.pagination ? req.pagination : null
    };

  retrieveViewModel(vm, query, function (err) {
    if (err) {
      return res.status(400).send({
        message: err
      })
    }

    req.vm = vm;

    next();
  });
}

exports.retrievePostsBySearch = function (req, res, next) {
  var query = _.trim(req.params.searchText),
    vm = {
      metaTitle: 'Posts containing "' + query + '"' + metaTitleSuffix,
      metaDescription: 'Posts containing "' + query + '" :',
      pagination: req.pagination ? req.pagination : null
    };

  retrieveViewModel(vm, query, function (err) {
    if (err) {
      return res.status(400).send({
        message: err
      })
    }

    req.vm = vm;

    next();
  });
}

exports.retrievePostsByTag = function (req, res, next) {
  // always return only published posts
  //query by tag
  var queryTag = "^" + _.replace(req.params.tag, '-', '.*')
  var query = {
      publish: true,
      tags: new RegExp(queryTag)
    },
    // meta info
    vm = {
      metaTitle: 'Posts tagged "' + _.replace(req.params.tag, '-', ' ') + '"' + metaTitleSuffix,
      metaDescription: 'Posts tagged "' + _.replace(req.params.tag, '-', ' ') + '" :',
      pagination: req.pagination ? req.pagination : null
    };
  retrieveViewModel(vm, query, function (err) {
    if (err) {
      return res.status(400).send({
        message: err
      })
    }

    req.vm = vm;

    next();
  });
}

exports.retrievePostsByDate = function (req, res, next) {
  // always return only published posts
  //query by date
  var queryDate = "^" + req.params.year + ".*" + req.params.month + ".*",
    query = {
      publish: true,
      publishDate: new RegExp(queryDate)
    },
    // meta info
    vm = {
      metaTitle: 'Posts for ' + moment(req.params.month, 'MM').format('MMMM') + ' ' + req.params.year + metaTitleSuffix,
      metaDescription: 'Posts for ' + moment(req.params.month, 'MM').format('MMMM') + ' ' + req.params.year + ' :',
      pagination: req.pagination ? req.pagination : null
    };
  retrieveViewModel(vm, query, function (err) {
    if (err) {
      return res.status(400).send({
        message: err
      })
    }

    req.vm = vm;

    next();
  });
}

exports.retrievePostsByAuthor = function (req, res, next) {

  User.findById(req.params.authorId).exec(function (err, account) {
    if (err) {
      return res.status(400).send({
        message: err
      })
    } else if (!account) {
      // redirect to home page if there are no posts with author
      return res.status(200).send({
        message: 'Author not found'
      });
    }

    // always return only published posts
    //query by date
    var query = {
        publish: true,
        authorId: req.params.authorId
      },
      vm = {
        metaTitle: 'Posts by ' + vm.author.authorName + metaTitleSuffix,
        metaDescription: 'Posts by ' + vm.author.authorName + ' :',
        pagination: req.pagination ? req.pagination : null,
        author: {
          authorName: account.get('displayName'),
          authorAbout: account.get('about'),
          authorEmail: account.get('email'),
          authorAvatar: account.get('avatarUrl')
        }
      };

    retrieveViewModel(vm, query, function (err) {
      if (err) {
        return res.status(400).send({
          message: err
        })
      }

      req.vm = vm;

      next();
    });
  });
}

// retrieve and transform published blog posts
function retrieveViewModel(vm, query, callback) {
  async.waterfall([
    function (done) {
      //check if query is search text
      if (typeof query === 'string') {
        postsModel.findText(query, vm.pagination, function (err, posts, totalCount) {
          if (err) {
            return done({
              message: err
            });
          }

          done(null, posts, totalCount);
        });
      } else {
        postsModel.getAll(query, vm.pagination, function (err, posts, totalCount) {
          if (err) {
            return done({
              message: err
            });
          }

          done(null, posts, totalCount);
        });
      }
    },
    function (posts, totalCount, done) {
      if (!posts.length) {
        //don't proceed if there are no posts
        return done(true);
      }

      if (vm.pagination) {
        vm.pagination.collectionSize = totalCount;
      }

      done(null, posts);
    },
    function (posts, done) {
      // retrieve google analytics for posts
      googleAnalytics.getData('2005-01-01', 'today', 'ga:pagePath', 'ga:pageviews', 'ga:pagePath=@/blog/post/', function (err, analytics) {
        if (err) {
          return done({
            message: err
          });
        }

        done(null, posts, analytics)
      });
    },
    function (posts, analytics, done) {
      // loop through each post and set meta data
      async.each(posts, (post, cb) => {
        //add page views from GA
        post.set('views', _.result(_.find(analytics, {
          'pagePath': post.get('url')
        }), 'pageviews'), {
          strict: false
        });

        //slugify tags
        post.set('slugTags', _.map(post.tags, function (tag) {
          return {
            text: _.trim(tag),
            slug: slugify(tag)
          };
        }), {
          strict: false
        });

        User.findById(post.authorId).exec(function (err, account) {
          if (err) {
            return cb(err);
          }

          // add author's information to posts
          post.set('authorName', account.get('displayName'), {
            strict: false
          });

          cb(null);
        });
      }, function (err) {
        if (err) {
          return done({
            message: err
          });
        }

        done(null, posts);
      });
    },
  ], function (err, result) {
    if (err && err.message) {
      return callback(err.message);
    }

    vm.posts = result ? result : null;

    callback(null);
  })
}

exports.sendViewModel = function (req, res, next) {
  if (req.vm && !req.vm.posts) {
    return res.status(200).send({
      vm: req.vm ? req.vm : {},
      message: 'No posts found'
    });
  }

  // check if unauthorized msg was set from core
  var message = req.flash('unauthorizedMsg')[0];

  res.status(200).send({
    vm: req.vm ? req.vm : {},
    message: message ? message : null
  });
}

// post by id route (permalink used by disqus comments plugin)
exports.retrievePostByID = function (req, res) {
  if (!req.query.id) {
    return res.status(404).send({
      message: 'Not found'
    });
  }

  postsModel.getById(req.query.id, function (err, post) {
    // find by post id or disqus id (old post id)
    if (err) {
      return res.status(404).send({
        message: err
      });
    } else if (!post) {
      return res.status(404).send({
        message: 'Not found'
      });
    }

    // 301 redirect to main post url
    var postUrl = '/blog/post/' + moment(post.publishDate).format('YYYY/MM/DD') + '/' + post.slug;
    return res.redirect(301, postUrl);
  })
};

// post details route
exports.retrievePostByDetails = function (req, res) {
  var hostDomain = req.protocol + '://' + req.get('host');

  async.waterfall([
    function (callback) {
      postsModel.getByUrl(req.params.year, req.params.month, req.params.day, req.params.slug, function (err, post) {
        if (err) {
          return callback(err)
        } else if (!post) {
          return callback('Post not found');
        }

        //  permalink used by disqus comment and social links
        post.set('perma_link', hostDomain + '/post?id=' + post._id, {
          strict: false
        });

        // slugify post tags
        post.set('slugTags', _.map(post.tags, function (tag) {
          return {
            text: tag,
            slug: slugify(tag)
          };
        }));

        callback(null, post)
      })
    },
    function (post, callback) {
      // retrieve google analytics for posts
      googleAnalytics.getData('2005-01-01', 'today', 'ga:pagePath', 'ga:pageviews', 'ga:pagePath=@' + post.get('url'), function (err, analytics) {
        if (err) {
          return callback(err);
        }

        //add page views from GA
        post.set('views', _.result(_.find(analytics, {
          'pagePath': post.get('url')
        }), 'pageviews'), {
          strict: false
        });

        callback(null, post)
      });
    },
    function (post, callback) {
      //retireve author's information
      User.findById(post.authorId).exec(function (err, account) {
        if (err) {
          return callback(err);
        }

        // add author's information to posts
        post.set('author', {
          authorName: account.get('displayName'),
          authorAbout: account.get('about'),
          authorEmail: account.get('email'),
          authorAvatar: account.get('avatarUrl')
        }, {
          strict: false
        });

        callback(null, post);
      });
    }
  ], function (err, post) {
    if (err) {
      return res.status(400).send({
        message: err
      });
    }

    // meta tags
    var vm = {};
    vm.metaTitle = post.title + metaTitleSuffix;
    vm.metaDescription = post.summary;
    vm.post = post ? post : {};

    res.status(200).send({
      vm: vm ? vm : []
    })
  })
};

exports.retrievePageDetails = function (req, res, next) {
  var vm = req.vm;

  pagesModel.getBySlug(req.params.slug)
    .then(function (page) {
      if (!page) {
        return res.status(404).send({
          message: 'Not found'
        })
      };

      vm.page = page;

      // meta tags
      vm.metaTitle = vm.page.title + metaTitleSuffix;
      vm.metaDescription = vm.page.description + metaTitleSuffix;

      render('pages/details.view.html', req, res);
    })
    .catch(function (err) {
      vm.error = err;
      // res.render(indexPath, vm);
    });
};
