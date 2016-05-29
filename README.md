# Suffix-search-javascript

This project is the javascript version of the original "GeneralizedSuffixTree" written in java by Alessandro Bahgat Shehata(https://github.com/abahgat/suffixtree).

I used it originally in the website: https://todo.recipes, but for reasons of caching used in webbrowsers (limit of amount of memory) I removed it and used the iterative search. So as today (May 2016) is not very useful for a website, maybe in the future it will be intersting.

To use the javascipt file, after including the file:

	var t = new GeneralizedSuffixTree();
	t.put("foo", 0);
	t.put("foobar", 1);
	console.log(t.search("fb",-1));