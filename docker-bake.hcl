// variables
variable "OWNER_NAME" {
  type = string
  default = "feederbox826"
}

variable "IMAGE_NAME" {
  type = string
  default = "stash-scrape-ci"
}

variable "SHORT_BUILD_DATE" {
  type = string
  default = formatdate("YYYY-MM-DD", BUILD_DATE)
}

variable "BUILD_DATE" {
  type = string
  default = timestamp()
}

// targets
target "default" {
  context = "docker"
  platforms = ["linux/amd64", "linux/arm64"]
  attest = [{
      type = "provenance"
      mode = "max"
  }, {
    type = "sbom"
  }]
  args = {
    BUILD_DATE = BUILD_DATE,
    SHORT_BUILD_DATE = SHORT_BUILD_DATE,
  }
  tags = [
    "ghcr.io/${OWNER_NAME}/${IMAGE_NAME}:latest"
  ]
  cache-from = [{
    type = "registry",
    ref = "ghcr.io/feederbox826/stash-s6:alpine"
  }]
}