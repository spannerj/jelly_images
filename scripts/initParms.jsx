g_initParams = {
    
    initParams: function(){         
        return initialiseParmeters ();
    }
};

//initialise the main parameters to default values
function initialiseParmeters() {

		var params = new Object();
		params["version"] = 1;
		params["useopen"] = false;
		params["includesub"] = false;
		params["source"] = "";
		params["open"] = false;
		params["saveinsame"] = true;
		params["dest"] = "";
		params["jpeg"] = true;
		params["psd"] = false;
		params["tiff"] = false;
		params["lzw"] = false;
		params["converticc"] = false;
		params["q"] = 5;
         params["imagecount"] = 6;
		params["max"] = true;
		params["jpegresize"] = false;
		params["jpegw"] = "";
		params["jpegh"] = "";
		params["psdresize"] = false;
		params["psdw"] = "";
		params["psdh"] = "";
		params["tiffresize"] = false;
		params["tiffw"] = "";
		params["tiffh"] = "";
		params["runaction"] = false;
		params["actionset"] = "";
		params["action"] = "";
		params["info"] = "";
		params["icc"] = true;
		params["keepstructure"] = false;
         params["watermark"] = "Return by";
         params["template"] = "";
		return params;
}