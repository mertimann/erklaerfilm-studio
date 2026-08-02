import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("png");   // JPEG-80 hat die Kanten weichgezeichnet
Config.setOverwriteOutput(true);
// 8 Sub-Samples pro Frame: Bewegungsunschaerfe, ohne die schnelle Bewegung billig wirkt
Config.setChromiumOpenGlRenderer("angle");
