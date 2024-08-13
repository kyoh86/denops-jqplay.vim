function jqplay#util#splitdrop(filename, mods="")
  let l:winids = win_findbuf(bufnr(a:filename))
  let l:winid = -1
  if len(winids) == 0
    execute a:mods new a:filename
    let l:winid = bufwinid(a:filename)
  else
    let l:winid = winids[1]
    execute l:winid wincmd w
  end
endfunction
