module.exports = function override (config, env) {
    console.log('override')
    let loaders = config.resolve
    loaders.fallback = {
        "fs": false,
        "tls": false,
        "net": false,
        "http": false,
        "https": false,
        "zlib": false ,
        "path": require.resolve("path-browserify"),
        "stream": false,
        "util": false,
        "crypto": false
    }
    return config
}