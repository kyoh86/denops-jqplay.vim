command! -nargs=* -complete=file -range Jqplay call denops#notify("jqplay", "command:start", [[<f-args>]])
" TODO: completion
" TODO: support <range>
" TODO: support jq parameters
