command! -nargs=+ -complete=file JqplayNull call denops#notify("jqplay", "command:null", [[<f-args>]])
command! -nargs=+ -complete=file JqplayFile call denops#notify("jqplay", "command:file", [[<f-args>]])
command! -nargs=* -complete=file -range JqplayBuffer call denops#notify("jqplay", "command:buffer", [[<f-args>]])
