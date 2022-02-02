// According to the standard redirect uris cannot contain fragments, so this page simply redirects to the fragmented version
window.location.replace(window.location.href.replace(/\/callback\.html/, '/#/callback'));

// make the typescript compiler happy
export {};
