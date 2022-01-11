CURRENTLINE=0
ENDLINE=0

while getopts "e:" opt; do
  case "$opt" in
    e)
      ENDLINE=${OPTARG}
    ;;
  esac
done

shift $(( OPTIND - 1 ))

echo "end: $ENDLINE"

INPUT="$1"
TARGET="$2"

echo "input: $INPUT"

while IFS= read -r line
do
  if [[ $CURRENTLINE -gt 0 ]]
  then
    echo "$CURRENTLINE: $line"
  fi
  ((CURRENTLINE+=1))

  #TODO: remove this early break when script is working
  #TODO: alternately, allow for command line inputs for start and stop lines
  if [[ $CURRENTLINE -gt $ENDLINE ]]
  then
    break
  fi
done < "$INPUT"