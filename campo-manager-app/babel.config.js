module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
    ], // Deixe a lista de plugins vazia.
  };
};