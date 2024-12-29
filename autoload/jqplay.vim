function jqplay#set_params(opts) abort
  call denops#notify("jqplay", "params:set-all", a:opts)
endfunction
function jqplay#buffer(opt) abort
  call denops#notify("jqplay", "buffer", a:opt)
endfunction

function jqplay#file(opt) abort
  call denops#notify("jqplay", "file", a:opt)
endfunction

function jqplay#empty(opt) abort
  call denops#notify("jqplay", "empty", a:opt)
endfunction
