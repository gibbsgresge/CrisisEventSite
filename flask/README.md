# Backend for CrisisBrief

To enable gpu usage of llm model install llama-cpp-python.
Download CUDA TOOLKIT from nvidia
https://developer.nvidia.com/cuda-downloads?target_os=Windows&target_arch=x86_64&target_version=10&target_type=exe_local


ans then run command CMAKE_ARGS="-DGGML_CUDA=on" FORCE_CMAKE=1 pip install --force-reinstall --no-cache-dir llama-cpp-python
on your BASH(do not use powershell or command prompt it will not run)

the build will take 30+ minutes depanding on what cpu you are using