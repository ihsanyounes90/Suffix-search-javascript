
function Edge(label, edge) {
    var label = label;
    var dest = edge;

    this.getLabel = function() {
        return label;
    }

    this.setLabel = function(l) {
        label = l;
    }

    this.getDest = function() {
        return dest;
    }

    this.setDest = function(d) {
        dest = d;
    }


}

function Node() {

    /**
     * The payload array used to store the data (indexes) associated with this node.
     * In this case, it is used to store all property indexes.
     * 
     * As it is handled, it resembles an ArrayList: when it becomes full it 
     * is copied to another bigger array (whose size is equals to data.length +
     * INCREMENT).
     * 
     * Originally it was a List<Integer> but it took too much memory, changing
     * it to int[] take less memory because indexes are stored using native
     * types.
     */
    var data;
    /**
     * Represents index of the last position used in the data int[] array.
     * 
     * It should always be less than data.length
     */
    var lastIdx = 0;
    /**
     * The starting size of the int[] array containing the payload
     */
    var START_SIZE = 0;
    /**
     * The increment in size used when the payload array is full
     */
    var INCREMENT = 1;
    /**
     * The set of edges starting from this node
     */
    var edges;
    /**
     * The suffix link as described in Ukkonen's paper.
     * if str is the string denoted by the path from the root to this, this.suffix
     * is the node denoted by the path that corresponds to str without the first char.
     */
    var suffix;
    /**
     * The total number of <em>different</em> results that are stored in this
     * node and in underlying ones (i.e. nodes that can be reached through paths
     * starting from <tt>this</tt>.
     * 
     * This must be calculated explicitly using computeAndCacheCount
     * @see Node#computeAndCacheCount() 
     */
     var resultCount = -1;

    /**
     * Creates a new Node
     */
    var __construct = function() {
        edges = new EdgeBag();
        suffix = null;
        data = new Array();//new int[START_SIZE];
    }();

    /**
     * Returns all the indexes associated to this node and its children.
     * @return all the indexes associated to this node and its children
     */
    //this.getData = function() {
        //return getData(-1);
    //}

    /**
     * Returns the first <tt>numElements</tt> elements from the ones associated to this node.
     *
     * Gets data from the payload of both this node and its children, the string representation
     * of the path to this node is a substring of the one of the children nodes.
     * 
     * @param numElements the number of results to return. Use -1 to get all
     * @return the first <tt>numElements</tt> associated to this node and children
     */
    this.getData = function(numElements) {
        var ret = Object.create(null);
        for (var i=0 ; i < data.length ; i++) {
            var num = data[i];
            ret[num] = num;
            if (ret.length == numElements) {
                return ret;
            }
        }
        // need to get more matches from child nodes. This is what may waste time
        var edgesValues = edges.values();
        for (var i=0 ; i < edgesValues.length ; i++) {
            var e = edgesValues[i];
            if (-1 == numElements || ret.length < numElements) {
                var eDest = e.getDest().getData(-1);
                for (var num in eDest) {
                    ret[num] = num;
                    if (ret.length == numElements) {
                        return ret;
                    }
                }
            }
        }
        return ret;
    }

    /**
     * Adds the given <tt>index</tt> to the set of indexes associated with <tt>this</tt>
     */
    this.addRef = function(index) {
        if (this.contains(index)) {
            return;
        }

        this.addIndex(index);

        // add this reference to all the suffixes as well
        var iter = suffix;
        while (iter != null) {
            if (iter.contains(index)) {
                break;
            }
            iter.addRef(index);
            iter = iter.suffix;
        }

    }

    /**
     * Tests whether a node contains a reference to the given index.
     * 
     * <b>IMPORTANT</b>: it works because the array is sorted by construction
     * 
     * @param index the index to look for
     * @return true <tt>this</tt> contains a reference to index
     */
    this.contains = function(index) {
        var low = 0;
        var high = lastIdx - 1;

        while (low <= high) {
            var mid = (low + high) >>> 1;
            var midVal = data[mid];

            if (midVal < index)
            low = mid + 1;
            else if (midVal > index)
            high = mid - 1;
            else
            return true;
        }
        return false;
        // Java 5 equivalent to
        // return java.util.Arrays.binarySearch(data, 0, lastIdx, index) >= 0;
    }

    /**
     * Computes the number of results that are stored on this node and on its
     * children, and caches the result.
     * 
     * Performs the same operation on subnodes as well
     * @return the number of results
     */
    this.computeAndCacheCount = function() {
        computeAndCacheCountRecursive();
        return resultCount;
    }

    this.computeAndCacheCountRecursive = function() {
        var ret = Object.create(null);
        for (var i=0 ; i < data.length ; i++) {
            var num = data[i];
            ret[num] = num;
        }
        
        var edgesValues = edges.values();
        for (var i=0 ; i < edgesValues.length ; i++) {
            var e = edgesValues[i];
            
            var eDest = e.getDest().computeAndCacheCountRecursive();
            for (var j=0 ; j < eDest.length ; j++) {
                var num = eDest[j];
                ret[num] = num;
            }
        }

        resultCount = ret.length;
        return ret;
    }

    /**
     * Returns the number of results that are stored on this node and on its
     * children.
     * Should be called after having called computeAndCacheCount.
     * 
     * @throws IllegalStateException when this method is called without having called
     * computeAndCacheCount first
     * @see Node#computeAndCacheCount() 
     * @todo this should raise an exception when the subtree is changed but count
     * wasn't updated
     */
    this.getResultCount = function(){
        if (-1 == resultCount) {
            throw new IllegalStateException("getResultCount() shouldnt be called without calling computeCount() first");
        }

        return resultCount;
    }

    this.addEdge = function(ch, e) {
        edges.put(ch, e);
    }

    this.getEdge = function(ch) {
        return edges.get(ch);
    }

    this.getEdges = function() {
        return edges;
    }

    this.getSuffix = function() {
        return suffix;
    }

    this.setSuffix = function(suff) {
        suffix = suff;
    }

    this.addIndex = function(index) {
        /*if (lastIdx == data.length) {
            var copy = new int[data.length + INCREMENT];
            System.arraycopy(data, 0, copy, 0, data.length);
            data = copy;
        }*/
        data[lastIdx++] = index;
    }
}


function EdgeBag(){
    var chars;
    var values;
    var BSEARCH_THRESHOLD = 6;

    this.put = function(character, e) {
        var c = character;//.charValue();
        if (c !== c) {//<- ?
            throw new IllegalArgumentException("Illegal input character " + c + ".");
        }
        
        if (chars == null) {
            chars = new Array();
            values = new Array();
        }
        var idx = this.search(c);
        var previous = null;

        if (idx < 0) {
            var currsize = chars.length;
            /*var copy = new byte[currsize + 1];
            System.arraycopy(chars, 0, copy, 0, currsize);
            chars = copy;*/
            /*var copy1 = new Edge[currsize + 1];
            System.arraycopy(values, 0, copy1, 0, currsize);
            values = copy1;*/
            chars.push(c);
            values.push(e);
            currsize++;
            if (currsize > BSEARCH_THRESHOLD) {
                this.sortArrays();
            }
        } else {
            previous = values[idx];
            values[idx] = e;
        }
        return previous;
    }
    
    this.get = function( maybeCharacter) {
        return get(( maybeCharacter).charValue());  // throws if cast fails.
    }

    this.get = function(c) {
        if (c != c) {
            throw new IllegalArgumentException("Illegal input character " + c + ".");
        }
        
        var idx = this.search(c);
        if (idx < 0) {
            return null;
        }
        return values[idx];
    }

    this.search = function(c) {
        if (chars == null)
            return -1;
        //TODO: do it
        //if (chars.length > BSEARCH_THRESHOLD) {
          //  return java.util.Arrays.binarySearch(chars, c);
        //}

        for (var i = 0; i < chars.length; i++) {
            if (c == chars[i]) {
                return i;
            }
        }
        return -1;
    }

    this.values = function() {
        return values == null ? [] : values;
    }
    
    /**
     * A trivial implementation of sort, used to sort chars[] and values[] according to the data in chars.
     * 
     * It was preferred to faster sorts (like qsort) because of the small sizes (<=36) of the collections involved.
     */
    this.sortArrays = function() {
        for (var i = 0; i < chars.length; i++) {
         for (var j = i; j > 0; j--) {
            if (chars[j-1] > chars[j]) {
               var swap = chars[j];
               chars[j] = chars[j-1];
               chars[j-1] = swap;

               var swapEdge = values[j];
               values[j] = values[j-1];
               values[j-1] = swapEdge;
            }
         }
      }
    }
    
    this.isEmpty = function() {
        return chars == null || chars.length == 0;
    }
    
    this.size = function() {
        return chars == null ? 0 : chars.length;
    }
}

function GeneralizedSuffixTree(){

    /**
     * The index of the last item that was added to the GST
     */
    var last = 0;
    /**
     * The root of the suffix tree
     */
    var root = new Node();
    /**
     * The last leaf that was added during the update operation
     */
    var activeLeaf = root;

    /**
     * Searches for the given word within the GST.
     *
     * Returns all the indexes for which the key contains the <tt>word</tt> that was
     * supplied as input.
     *
     * @param word the key to search for
     * @return the collection of indexes associated with the input <tt>word</tt>
     */
    //this.search = function(word) {
        //return search(word, -1);
    //}
    
    /**
     * Searches for the given word within the GST and returns at most the given number of matches.
     *
     * @param word the key to search for
     * @param results the max number of results to return
     * @return at most <tt>results</tt> values for the given word
     */
    this.search = function(word, results) {
        var tmpNode = searchNode(word);
        if (tmpNode == null) {
            return null;
        }
        return tmpNode.getData(results);
    }

    /**
     * Searches for the given word within the GST and returns at most the given number of matches.
     *
     * @param word the key to search for
     * @param to the max number of results to return
     * @return at most <tt>results</tt> values for the given word
     * @see GeneralizedSuffixTree#ResultInfo
     */
     this.searchWithCount = function(word, to) {
        var tmpNode = searchNode(word);
        if (tmpvar == null) {
            return new ResultInfo(Collections.EMPTY_LIST, 0);
        }

        return new ResultInfo(tmpNode.getData(to), tmpNode.getResultCount());
    }

    /**
     * Returns the tree node (if present) that corresponds to the given string.
     */
    var searchNode = function(word) {
        /*
         * Verifies if exists a path from the root to a node such that the concatenation
         * of all the labels on the path is a superstring of the given word.
         * If such a path is found, the last node on it is returned.
         */
        var currentNode = root;
        var currentEdge;

        for (var i = 0; i < word.length; ++i) {
            var ch = word.charAt(i);
            // follow the edge corresponding to this char
            currentEdge = currentNode.getEdge(ch);
            if (null == currentEdge) {
                // there is no edge starting with this char
                return null;
            } else {
                var label = currentEdge.getLabel();
                var lenToMatch = Math.min(word.length - i, label.length);
                if (word.substr(i,lenToMatch) != label.substr(0, lenToMatch) ) {
                    // the label on the edge does not correspond to the one in the string to search
                    return null;
                }

                if (label.length >= word.length - i) {
                    return currentEdge.getDest();
                } else {
                    // advance to next node
                    currentNode = currentEdge.getDest();
                    i += lenToMatch - 1;
                }
            }
        }

        return null;
    }

    /**
     * Adds the specified <tt>index</tt> to the GST under the given <tt>key</tt>.
     *
     * Entries must be inserted so that their indexes are in non-decreasing order,
     * otherwise an IllegalStateException will be raised.
     *
     * @param key the string key that will be added to the index
     * @param index the value that will be added to the index
     * @throws IllegalStateException if an invalid index is passed as input
     */
    this.put = function(key, index) {
        if (index < last) {
            throw new IllegalStateException("The input index must not be less than any of the previously inserted ones. Got " + index + ", expected at least " + last);
        } else {
            last = index;
        }

        // reset activeLeaf
        activeLeaf = root;

        var remainder = key;
        var s = root;

        // proceed with tree construction (closely related to procedure in
        // Ukkonen's paper)
        var text = "";
        // iterate over the string, one var at a time
        for (var i = 0; i < remainder.length; i++) {
            // line 6
            text += remainder.charAt(i);
            // use intern to make sure the resulting string is in the pool.
            //text = text.intern();

            // line 7: update the tree with the new transitions due to this new char
            var active = update(s, text, remainder.substring(i), index);
            // line 8: make sure the active pair is canonical
            active = canonize(active.getFirst(), active.getSecond());
            
            s = active.getFirst();
            text = active.getSecond();
        }

        // add leaf suffix link, is necessary
        if (null == activeLeaf.getSuffix() && activeLeaf != root && activeLeaf != s) {
            activeLeaf.setSuffix(s);
        }

    }

    /**
     * Tests whether the string stringPart + t is contained in the subtree that has inputs as root.
     * If that's not the case, and there exists a path of edges e1, e2, ... such that
     *     e1.label + e2.label + ... + $end = stringPart
     * and there is an edge g such that
     *     g.label = stringPart + rest
     * 
     * Then g will be split in two different edges, one having $end as label, and the other one
     * having rest as label.
     *
     * @param inputs the starting node
     * @param stringPart the string to search
     * @param t the following character
     * @param remainder the remainder of the string to add to the index
     * @param value the value to add to the index
     * @return a pair containing
     *                  true/false depending on whether (stringPart + t) is contained in the subtree starting in inputs
     *                  the last node that can be reached by following the path denoted by stringPart starting from inputs
     *         
     */
    testAndSplit = function(inputs, stringPart, t, remainder, value) {
        // descend the tree as far as possible
        var ret = canonize(inputs, stringPart);
        var s = ret.getFirst();
        var str = ret.getSecond();

        if ("" != str) {
            var g = s.getEdge(str.charAt(0));

            var label = g.getLabel();
            // must see whether "str" is substring of the label of an edge
            if (label.length > str.length && label.charAt(str.length) == t) {
                return new Pair(true, s);
            } else {
                // need to split the edge
                var newlabel = label.substring(str.length);
                //assert (label.startsWith(str));

                // build a new node
                var r = new Node();
                // build a new edge
                var newedge = new Edge(str, r);

                g.setLabel(newlabel);

                // link s -> r
                r.addEdge(newlabel.charAt(0), g);
                s.addEdge(str.charAt(0), newedge);

                return new Pair(false, r);
            }

        } else {
            var e = s.getEdge(t);
            if (null == e) {
                // if there is no t-transtion from s
                return new Pair(false, s);
            } else {
                if (remainder == e.getLabel()) {
                    // update payload of destination node
                    e.getDest().addRef(value);
                    return new Pair(true, s);
                } else if (remainder.startsWith(e.getLabel())) {
                    return new Pair(true, s);
                } else if (e.getLabel().startsWith(remainder)) {
                    // need to split as above
                    var newNode = new Node();
                    newNode.addRef(value);

                    var newEdge = new Edge(remainder, newNode);

                    e.setLabel(e.getLabel().substring(remainder.length));

                    newNode.addEdge(e.getLabel().charAt(0), e);

                    s.addEdge(t, newEdge);

                    return new Pair(false, s);
                } else {
                    // they are different words. No prefix. but they may still share some common substr
                    return new Pair(true, s);
                }
            }
        }

    }

    /**
     * Return a (Node, String) (n, remainder) pair such that n is a farthest descendant of
     * s (the input node) that can be reached by following a path of edges denoting
     * a prefix of inputstr and remainder will be string that must be
     * appended to the concatenation of labels from s to n to get inpustr.
     */
    canonize = function(s, inputstr) {

        if ("" == inputstr) {
            return new Pair(s, inputstr);
        } else {
            var currentNode = s;
            var str = inputstr;
            var g = s.getEdge(str.charAt(0));
            // descend the tree as long as a proper label is found
            while (g != null && str.startsWith(g.getLabel())) {
                str = str.substring(g.getLabel().length);
                currentNode = g.getDest();
                if (str.length > 0) {
                    g = currentNode.getEdge(str.charAt(0));
                }
            }

            return new Pair(currentNode, str);
        }
    }

    /**
     * Updates the tree starting from inputvar and by adding stringPart.
     * 
     * Returns a reference (Node, String) pair for the string that has been added so far.
     * This means:
     * - the var will be the var that can be reached by the longest path string (S1)
     *   that can be obtained by concatenating consecutive edges in the tree and
     *   that is a substring of the string added so far to the tree.
     * - the var will be the remainder that must be added to S1 to get the string
     *   added so far.
     * 
     * @param inputvar the node to start from
     * @param stringPart the string to add to the tree
     * @param rest the rest of the string
     * @param value the value to add to the index
     */
    update = function(inputNode, stringPart, rest, value) {
        var s = inputNode;
        var tempstr = stringPart;
        var newChar = stringPart.charAt(stringPart.length - 1);

        // line 1
        var oldroot = root;

        // line 1b
        var ret = testAndSplit(s, tempstr.substring(0, tempstr.length - 1), newChar, rest, value);

        var r = ret.getSecond();
        var endpoint = ret.getFirst();

        var leaf;
        // line 2
        while (!endpoint) {
            // line 3
            var tempEdge = r.getEdge(newChar);
            if (null != tempEdge) {
                // such a node is already present. This is one of the main differences from Ukkonen's case:
                // the tree can contain deeper nodes at this stage because different strings were added by previous iterations.
                leaf = tempEdge.getDest();
            } else {
                // must build a new leaf
                leaf = new Node();
                leaf.addRef(value);
                var newedge = new Edge(rest, leaf);
                r.addEdge(newChar, newedge);
            }

            // update suffix link for newly created leaf
            if (activeLeaf != root) {
                activeLeaf.setSuffix(leaf);
            }
            activeLeaf = leaf;

            // line 4
            if (oldroot != root) {
                oldroot.setSuffix(r);
            }

            // line 5
            oldroot = r;

            // line 6
            if (null == s.getSuffix()) { // root node
                //assert (root == s);
                // this is a special case to handle what is referred to as node _|_ on the paper
                tempstr = tempstr.substring(1);
            } else {
               var canret = canonize(s.getSuffix(), safeCutLastChar(tempstr));
                s = canret.getFirst();
                // use intern to ensure that tempstr is a reference from the string pool
                tempstr = (canret.getSecond() + tempstr.charAt(tempstr.length - 1));//.intern();
            }

            // line 7
            ret = testAndSplit(s, safeCutLastChar(tempstr), newChar, rest, value);
            r = ret.getSecond();
            endpoint = ret.getFirst();

        }

        // line 8
        if (oldroot != root) {
            oldroot.setSuffix(r);
        }
        oldroot = root;

        return new Pair(s, tempstr);
    }

    getRoot = function() {
        return root;
    }

    safeCutLastChar = function(seq) {
        if (seq.length == 0) {
            return "";
        }
        return seq.substring(0, seq.length - 1);
    }

    computeCount = function() {
        return root.computeAndCacheCount();
    }

    function Pair(f,s) {

        var first = f;
        var second = s;

        this.getFirst = function() {
            return first;
        }

        this.getSecond = function() {
            return second;
        }
    }

}


var t = new GeneralizedSuffixTree();
t.put("foo", 0);
t.put("foobar", 1);

  console.log(t.search("fb",-1));